import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CognitoService } from './services/cognito.service';
import { AnalyticsService } from './services/analytics.service';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
  styles: [':host { display: block; }'],
})
export class AppComponent implements OnInit, OnDestroy {
  private sub?: Subscription;

  constructor(
    private cognito: CognitoService,
    private analytics: AnalyticsService,
  ) {}

  ngOnInit(): void {
    this.sub = this.cognito.user$.subscribe((user) => {
      if (user) {
        this.analytics.identify(user.userId);
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
