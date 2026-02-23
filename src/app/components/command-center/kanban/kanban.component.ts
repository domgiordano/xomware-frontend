import { Component, OnInit } from '@angular/core';

export interface KanbanCard {
  id: string;
  title: string;
  description: string;
  labels: string[];
  repo?: string;
  prUrl?: string;
  column: string;
  createdAt: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-kanban',
  templateUrl: './kanban.component.html',
  styleUrls: ['./kanban.component.scss'],
})
export class KanbanComponent implements OnInit {
  columns: KanbanColumn[] = [
    { id: 'todo', title: 'To Do', icon: '📋', color: '#8a8a9a' },
    { id: 'in-progress', title: 'In Progress', icon: '🔨', color: '#00b4d8' },
    { id: 'in-review', title: 'In Review', icon: '👀', color: '#ff6b35' },
    { id: 'done', title: 'Done', icon: '✅', color: '#00ffab' },
  ];

  cards: KanbanCard[] = [];
  draggedCard: KanbanCard | null = null;
  showAddForm = false;
  addToColumn = '';
  newCard = { title: '', description: '', labels: '' };

  ngOnInit(): void {
    this.loadCards();
  }

  getColumnCards(columnId: string): KanbanCard[] {
    return this.cards.filter((c) => c.column === columnId);
  }

  onDragStart(card: KanbanCard): void {
    this.draggedCard = card;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent, columnId: string): void {
    event.preventDefault();
    if (this.draggedCard) {
      this.draggedCard.column = columnId;
      this.draggedCard = null;
      this.saveCards();
    }
  }

  openAddForm(columnId: string): void {
    this.addToColumn = columnId;
    this.showAddForm = true;
    this.newCard = { title: '', description: '', labels: '' };
  }

  addCard(): void {
    if (!this.newCard.title.trim()) return;
    const card: KanbanCard = {
      id: 'card-' + Date.now(),
      title: this.newCard.title.trim(),
      description: this.newCard.description.trim(),
      labels: this.newCard.labels
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean),
      column: this.addToColumn,
      createdAt: new Date().toISOString(),
    };
    this.cards.push(card);
    this.showAddForm = false;
    this.saveCards();
  }

  deleteCard(card: KanbanCard): void {
    this.cards = this.cards.filter((c) => c.id !== card.id);
    this.saveCards();
  }

  private saveCards(): void {
    localStorage.setItem('xom_kanban', JSON.stringify(this.cards));
  }

  private loadCards(): void {
    const saved = localStorage.getItem('xom_kanban');
    if (saved) {
      try {
        this.cards = JSON.parse(saved);
      } catch {
        this.cards = this.getDefaultCards();
      }
    } else {
      this.cards = this.getDefaultCards();
      this.saveCards();
    }
  }

  private getDefaultCards(): KanbanCard[] {
    return [
      {
        id: 'card-1',
        title: 'Angular 18 Upgrade - xomify',
        description: 'Upgrade xomify-frontend from Angular 16 to 18',
        labels: ['angular', 'upgrade'],
        repo: 'xomify-frontend',
        prUrl: 'https://github.com/Xomware/xomify-frontend/pull/146',
        column: 'in-review',
        createdAt: '2026-02-21T00:00:00Z',
      },
      {
        id: 'card-2',
        title: 'Angular 18 Upgrade - xomware',
        description: 'Upgrade xomware-frontend from Angular 16 to 18',
        labels: ['angular', 'upgrade'],
        repo: 'xomware-frontend',
        prUrl: 'https://github.com/Xomware/xomware-frontend/pull/2',
        column: 'in-review',
        createdAt: '2026-02-21T00:00:00Z',
      },
      {
        id: 'card-3',
        title: 'Command Center Dashboard',
        description: 'Build the Xomware Command Center with Kanban, config viewer, activity log, and pixel office',
        labels: ['feature', 'dashboard'],
        repo: 'xomware-frontend',
        column: 'in-progress',
        createdAt: '2026-02-22T00:00:00Z',
      },
      {
        id: 'card-4',
        title: 'AWS Provider 5.x - xomify',
        description: 'Upgrade AWS provider from 4.38 to 5.x',
        labels: ['terraform', 'infra'],
        repo: 'xomify-infrastructure',
        prUrl: 'https://github.com/Xomware/xomify-infrastructure/pull/35',
        column: 'in-review',
        createdAt: '2026-02-21T00:00:00Z',
      },
      {
        id: 'card-5',
        title: 'OIDC Migration - xomify',
        description: 'Migrate from static AWS creds to OIDC',
        labels: ['security', 'infra'],
        repo: 'xomify-infrastructure',
        prUrl: 'https://github.com/Xomware/xomify-infrastructure/pull/34',
        column: 'in-review',
        createdAt: '2026-02-21T00:00:00Z',
      },
      {
        id: 'card-6',
        title: 'CI/CD Pipeline - xomify',
        description: 'Add GitHub Actions CI/CD pipeline',
        labels: ['devops', 'ci-cd'],
        repo: 'xomify-frontend',
        prUrl: 'https://github.com/Xomware/xomify-frontend/pull/148',
        column: 'in-review',
        createdAt: '2026-02-21T00:00:00Z',
      },
      {
        id: 'card-7',
        title: 'Pixel Office Visualization',
        description: 'Build animated pixel art office showing agent status',
        labels: ['feature', 'fun'],
        column: 'todo',
        createdAt: '2026-02-22T00:00:00Z',
      },
      {
        id: 'card-8',
        title: 'Centralized Logging System',
        description: 'Set up MEMORY.md and LESSONS.md with structured logging',
        labels: ['infrastructure'],
        column: 'todo',
        createdAt: '2026-02-22T00:00:00Z',
      },
    ];
  }
}
