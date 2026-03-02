import { Component, OnInit, OnDestroy } from '@angular/core';
import { GithubService, RepoWithPRs, PRWithChecks, CIStatus } from '../../services/github.service';

type FilterTab = 'all' | 'needs_review' | 'failing' | 'ready';

@Component({
  selector: 'app-pr-dashboard',
  templateUrl: './pr-dashboard.component.html',
  styleUrls: ['./pr-dashboard.component.scss'],
})
export class PrDashboardComponent implements OnInit, OnDestroy {
  repoGroups: RepoWithPRs[] = [];
  loading = true;
  error: string | null = null;
  lastUpdated: Date | null = null;
  activeFilter: FilterTab = 'all';
  private refreshTimer: any;

  // Brand colors for repo borders
  private repoColors = [
    '#00b4d8', '#FF6B35', '#9C0ABF', '#00FFAB', '#4A90D9',
    '#E74C3C', '#FFB800', '#34C759', '#48cae4', '#ff6b35',
  ];

  constructor(private github: GithubService) {}

  ngOnInit(): void {
    this.loadData();
    this.refreshTimer = setInterval(() => this.loadData(), 60_000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  async loadData(): Promise<void> {
    this.loading = this.repoGroups.length === 0; // Only show loading on first load
    this.error = null;
    try {
      this.repoGroups = await this.github.loadAllPRData();
      this.lastUpdated = new Date();
    } catch (e: any) {
      this.error = e.message || 'Failed to load PR data';
    }
    this.loading = false;
  }

  get allPRs(): PRWithChecks[] {
    return this.repoGroups.flatMap(g => g.prs);
  }

  get filteredGroups(): RepoWithPRs[] {
    if (this.activeFilter === 'all') return this.repoGroups;
    return this.repoGroups
      .map(g => ({ ...g, prs: g.prs.filter(pr => this.matchesFilter(pr)) }))
      .filter(g => g.prs.length > 0);
  }

  get totalPRs(): number { return this.allPRs.length; }
  get failingCount(): number { return this.allPRs.filter(p => p.ciStatus === 'failing').length; }
  get readyCount(): number { return this.allPRs.filter(p => p.ciStatus === 'passing' && !p.draft).length; }
  get needsReviewCount(): number { return this.allPRs.filter(p => !p.draft && p.ciStatus !== 'failing').length; }

  setFilter(tab: FilterTab): void { this.activeFilter = tab; }

  toggleRepo(group: RepoWithPRs): void { group.collapsed = !group.collapsed; }

  getRepoColor(index: number): string {
    return this.repoColors[index % this.repoColors.length];
  }

  getStatusEmoji(status: CIStatus): string {
    switch (status) {
      case 'passing': return '🟢';
      case 'failing': return '🔴';
      case 'pending': return '🟡';
      case 'no_ci': return '⚪';
      default: return '⚪';
    }
  }

  getStatusLabel(status: CIStatus): string {
    return status.replace('_', ' ').toUpperCase();
  }

  getStatusClass(status: CIStatus): string {
    return `ci-${status}`;
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  private matchesFilter(pr: PRWithChecks): boolean {
    switch (this.activeFilter) {
      case 'needs_review': return !pr.draft && pr.ciStatus !== 'failing';
      case 'failing': return pr.ciStatus === 'failing';
      case 'ready': return pr.ciStatus === 'passing' && !pr.draft;
      default: return true;
    }
  }
}
