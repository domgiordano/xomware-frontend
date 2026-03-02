import { Injectable } from '@angular/core';

export interface GithubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
}

export interface GithubPR {
  number: number;
  title: string;
  html_url: string;
  user: { login: string; avatar_url: string };
  head: { sha: string; ref: string };
  base: { ref: string };
  created_at: string;
  updated_at: string;
  draft: boolean;
}

export type CIStatus = 'passing' | 'failing' | 'pending' | 'no_ci';

export interface CheckStatus {
  status: CIStatus;
  total: number;
  passed: number;
  failed: number;
  pending: number;
}

export interface PRWithChecks extends GithubPR {
  repoName: string;
  ciStatus: CIStatus;
  checkDetails: CheckStatus;
}

export interface RepoWithPRs {
  repo: GithubRepo;
  prs: PRWithChecks[];
  collapsed: boolean;
}

const API = 'https://api.github.com';
const ORG = 'Xomware';
const CACHE_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class GithubService {
  private cache = new Map<string, { data: any; ts: number }>();

  async getOrganizationRepos(): Promise<GithubRepo[]> {
    return this.cachedFetch<GithubRepo[]>(`${API}/orgs/${ORG}/repos?per_page=100&sort=updated`);
  }

  async getOpenPRs(repo: string): Promise<GithubPR[]> {
    return this.cachedFetch<GithubPR[]>(`${API}/repos/${ORG}/${repo}/pulls?state=open&per_page=100`);
  }

  async getPRCheckStatus(repo: string, sha: string): Promise<CheckStatus> {
    const res = await this.cachedFetch<any>(`${API}/repos/${ORG}/${repo}/commits/${sha}/check-runs`);
    const runs: any[] = res.check_runs || [];
    if (runs.length === 0) {
      return { status: 'no_ci', total: 0, passed: 0, failed: 0, pending: 0 };
    }
    const passed = runs.filter((r: any) => r.conclusion === 'success').length;
    const failed = runs.filter((r: any) => r.conclusion === 'failure' || r.conclusion === 'cancelled').length;
    const pending = runs.filter((r: any) => r.status !== 'completed').length;
    let status: CIStatus = 'passing';
    if (failed > 0) status = 'failing';
    else if (pending > 0) status = 'pending';
    return { status, total: runs.length, passed, failed, pending };
  }

  async loadAllPRData(): Promise<RepoWithPRs[]> {
    const repos = await this.getOrganizationRepos();
    const results: RepoWithPRs[] = [];

    for (const repo of repos) {
      await this.sleep(100); // Rate limit delay
      try {
        const prs = await this.getOpenPRs(repo.name);
        const prsWithChecks: PRWithChecks[] = [];

        for (const pr of prs) {
          await this.sleep(50);
          try {
            const checks = await this.getPRCheckStatus(repo.name, pr.head.sha);
            prsWithChecks.push({
              ...pr,
              repoName: repo.name,
              ciStatus: checks.status,
              checkDetails: checks,
            });
          } catch {
            prsWithChecks.push({
              ...pr,
              repoName: repo.name,
              ciStatus: 'no_ci',
              checkDetails: { status: 'no_ci', total: 0, passed: 0, failed: 0, pending: 0 },
            });
          }
        }

        if (prsWithChecks.length > 0) {
          results.push({ repo, prs: prsWithChecks, collapsed: false });
        }
      } catch {
        // Skip repos that error
      }
    }

    // Sort: repos with PRs first, then by PR count desc
    results.sort((a, b) => b.prs.length - a.prs.length);
    return results;
  }

  private async cachedFetch<T>(url: string): Promise<T> {
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.ts < CACHE_MS) {
      return cached.data as T;
    }
    const res = await fetch(url, {
      headers: { 'Accept': 'application/vnd.github+json' }
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const data = await res.json();
    this.cache.set(url, { data, ts: Date.now() });
    return data as T;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
