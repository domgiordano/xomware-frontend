import { Component } from '@angular/core';

interface AppCard {
  name: string;
  description: string;
  color: string;
  url: string;
  monsterState: string;
  icon: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  monsterState = 'idle';
  private idleTimer: any;
  private readonly SLEEP_DELAY = 10000;

  apps: AppCard[] = [
    {
      name: 'xomify',
      description: 'Your Spotify stats, wrapped your way. Top songs, artists, genres & more.',
      color: '#9c0abf',
      url: 'https://xomify.xomware.com',
      monsterState: 'headphones',
      icon: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
    },
    {
      name: 'xomcloud',
      description: 'Your SoundCloud library, organized. Discover and manage your music collection.',
      color: '#ff6b35',
      url: 'https://xomcloud.xomware.com',
      monsterState: 'dj',
      icon: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM7.76 16.24l-1.41 1.41C4.78 16.1 4 14.05 4 12c0-2.05.78-4.1 2.34-5.66l1.41 1.41C6.59 8.93 6 10.46 6 12s.59 3.07 1.76 4.24zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm5.66 1.66l-1.41-1.41C17.41 15.07 18 13.54 18 12s-.59-3.07-1.76-4.24l1.41-1.41C19.22 7.9 20 9.95 20 12c0 2.05-.78 4.1-2.34 5.66zM12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
    },
    {
      name: 'xomper',
      description: 'Fantasy football analytics. Track your dynasty league, players & matchups.',
      color: '#00ffab',
      url: 'https://xomper.xomware.com',
      monsterState: 'football',
      icon: 'M3.02 15.62c-.08 2.42.32 4.34.67 4.69s2.28.76 4.69.67l-5.36-5.36zM15.75 3.08c-4.01.15-8.63 1.89-11.52 4.78l11.91 11.91c2.89-2.89 4.63-7.51 4.78-11.52L15.75 3.08zm-1.83 1.83l1.17 1.17-6.3 6.3-1.17-1.17 6.3-6.3zm2.35 2.35l1.17 1.17-6.3 6.3-1.17-1.17 6.3-6.3zM3.69 20.93c.35.35 2.27.76 4.69.67l-5.36-5.36c-.08 2.42.32 4.34.67 4.69z',
    },
  ];

  constructor() {
    this.resetIdleTimer();
  }

  onCardHover(state: string): void {
    this.monsterState = state;
    this.resetIdleTimer();
  }

  onCardLeave(): void {
    this.monsterState = 'idle';
    this.resetIdleTimer();
  }

  onPageInteraction(): void {
    if (this.monsterState === 'sleep') {
      this.monsterState = 'idle';
    }
    this.resetIdleTimer();
  }

  private resetIdleTimer(): void {
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      if (this.monsterState === 'idle') {
        this.monsterState = 'sleep';
      }
    }, this.SLEEP_DELAY);
  }
}
