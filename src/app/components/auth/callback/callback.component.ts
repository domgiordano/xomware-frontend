import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CognitoService } from '../../../services/cognito.service';

/**
 * Lands here after the Hosted UI / Google OAuth redirect. Amplify processes
 * the auth code internally and emits `signedIn` via Hub; we just wait for
 * the user observable to populate, then route home.
 */
@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.scss'],
})
export class CallbackComponent implements OnInit, OnDestroy {
  private sub?: Subscription;
  private timer?: ReturnType<typeof setTimeout>;
  errored = false;

  constructor(private cognito: CognitoService, private router: Router) {}

  ngOnInit(): void {
    this.sub = this.cognito.user$.subscribe((user) => {
      if (user) this.router.navigateByUrl('/');
    });
    // Fallback if the redirect doesn't resolve into a session within 8s.
    this.timer = setTimeout(() => {
      if (!this.cognito.currentUser) this.errored = true;
    }, 8000);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.timer) clearTimeout(this.timer);
  }
}
