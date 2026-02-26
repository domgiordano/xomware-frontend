import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface InboxItem {
  id: string;
  title: string;
  description: string;
  repoHint: string;
  status: 'pending' | 'processing' | 'processed';
  createdAt: string;
  processedAt: string | null;
  issuesCreated: string[];
}

export interface InboxResponse {
  items: InboxItem[];
}

@Injectable({ providedIn: 'root' })
export class InboxService {
  private readonly baseUrl = environment.apiBaseUrl + '/status/board/inbox';

  readonly inbox$ = new BehaviorSubject<InboxItem[]>([]);

  constructor(private auth: AuthService) {}

  async fetch(): Promise<void> {
    try {
      const res = await fetch(this.baseUrl, {
        headers: { 'X-Auth-Hash': this.auth.getPassphraseHash() },
      });
      if (!res.ok) return;
      const data: InboxResponse = await res.json();
      this.inbox$.next(data.items || []);
    } catch {
      // silent
    }
  }

  async addIdea(title: string, description: string, repoHint: string): Promise<boolean> {
    try {
      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Hash': this.auth.getPassphraseHash(),
        },
        body: JSON.stringify({ title, description, repoHint }),
      });
      if (!res.ok) return false;
      await this.fetch();
      return true;
    } catch {
      return false;
    }
  }
}
