import { Injectable } from '@angular/core';

export interface GitHubLabel {
  name: string;
  color: string;
  description?: string;
}

export interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubPR {
  number: number;
  title: string;
  html_url: string;
  state: string;
  merged: boolean;
  draft: boolean;
}

export interface TicketDetail {
  number: number;
  title: string;
  body: string;
  state: string;
  labels: GitHubLabel[];
  assignee: GitHubUser | null;
  assignees: GitHubUser[];
  created_at: string;
  updated_at: string;
  html_url: string;
  repository_url: string;
  pull_request?: { html_url: string };
  linkedPRs: GitHubPR[];
  relatedIssues: { number: number; title: string; state: string; html_url: string }[];
  repoOwner: string;
  repoName: string;
}

@Injectable({ providedIn: 'root' })
export class TicketDetailService {
  private readonly GITHUB_API = 'https://api.github.com';

  async fetchTicket(owner: string, repo: string, issueNumber: number): Promise<TicketDetail | null> {
    try {
      // Fetch issue
      const issueRes = await fetch(`${this.GITHUB_API}/repos/${owner}/${repo}/issues/${issueNumber}`, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });
      if (!issueRes.ok) return null;
      const issue = await issueRes.json();

      // Fetch timeline events for linked PRs
      const linkedPRs = await this.fetchLinkedPRs(owner, repo, issueNumber);

      // Parse related issues from body
      const relatedIssues = await this.parseRelatedIssues(owner, repo, issue.body || '');

      return {
        number: issue.number,
        title: issue.title,
        body: issue.body || '',
        state: issue.state,
        labels: issue.labels || [],
        assignee: issue.assignee,
        assignees: issue.assignees || [],
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        html_url: issue.html_url,
        repository_url: issue.repository_url,
        pull_request: issue.pull_request,
        linkedPRs,
        relatedIssues,
        repoOwner: owner,
        repoName: repo,
      };
    } catch (err) {
      console.error('Failed to fetch ticket:', err);
      return null;
    }
  }

  private async fetchLinkedPRs(owner: string, repo: string, issueNumber: number): Promise<GitHubPR[]> {
    try {
      const eventsRes = await fetch(
        `${this.GITHUB_API}/repos/${owner}/${repo}/issues/${issueNumber}/timeline`,
        { headers: { Accept: 'application/vnd.github.v3+json' } }
      );
      if (!eventsRes.ok) return [];
      const events = await eventsRes.json();

      const prNumbers = new Set<number>();
      const prs: GitHubPR[] = [];

      for (const event of events) {
        if (event.event === 'cross-referenced' && event.source?.issue?.pull_request) {
          const pr = event.source.issue;
          if (!prNumbers.has(pr.number)) {
            prNumbers.add(pr.number);
            prs.push({
              number: pr.number,
              title: pr.title,
              html_url: pr.html_url,
              state: pr.pull_request?.merged_at ? 'merged' : pr.state,
              merged: !!pr.pull_request?.merged_at,
              draft: pr.draft || false,
            });
          }
        }
      }
      return prs;
    } catch {
      return [];
    }
  }

  private async parseRelatedIssues(
    owner: string,
    repo: string,
    body: string
  ): Promise<{ number: number; title: string; state: string; html_url: string }[]> {
    // Parse #123 references from body
    const refs = new Set<number>();
    const regex = /#(\d+)/g;
    let match;
    while ((match = regex.exec(body)) !== null) {
      refs.add(parseInt(match[1], 10));
    }

    const results: { number: number; title: string; state: string; html_url: string }[] = [];
    // Limit to 5 to avoid rate limiting
    const refsArr = [...refs].slice(0, 5);

    await Promise.all(
      refsArr.map(async (num) => {
        try {
          const res = await fetch(`${this.GITHUB_API}/repos/${owner}/${repo}/issues/${num}`, {
            headers: { Accept: 'application/vnd.github.v3+json' },
          });
          if (res.ok) {
            const issue = await res.json();
            results.push({
              number: issue.number,
              title: issue.title,
              state: issue.state,
              html_url: issue.html_url,
            });
          }
        } catch { /* skip */ }
      })
    );

    return results.sort((a, b) => a.number - b.number);
  }

  parseIssueUrl(url: string): { owner: string; repo: string; issueNumber: number } | null {
    // Parse https://github.com/Owner/Repo/issues/123
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2], issueNumber: parseInt(match[3], 10) };
  }
}
