import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CognitoService } from '../../../services/cognito.service';
import { AnalyticsService } from '../../../services/analytics.service';

@Component({
  selector: 'app-verify',
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.scss'],
})
export class VerifyComponent implements OnInit {
  readonly form: FormGroup;
  loading = false;
  resending = false;
  errorMessage = '';
  infoMessage = '';
  email = '';
  /** Forwarded to sign-in after verify so the auth-gate `next` survives sign-up→verify→sign-in. */
  private nextPath: string | null = null;

  constructor(
    private fb: FormBuilder,
    private cognito: CognitoService,
    private analytics: AnalyticsService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });
  }

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
    const raw = this.route.snapshot.queryParamMap.get('next');
    if (raw && raw.startsWith('/') && !raw.startsWith('//')) {
      this.nextPath = raw;
    }
  }

  fieldInvalid(name: 'code'): boolean {
    const ctrl = this.form.get(name);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  onSubmit(): void {
    if (!this.email) {
      this.errorMessage = 'Missing email — go back and start sign-up again.';
      return;
    }
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.infoMessage = '';
    const { code } = this.form.value as { code: string };

    this.cognito.confirmSignUp(this.email, code).subscribe({
      next: (confirmed) => {
        this.loading = false;
        if (confirmed) {
          this.analytics.track('verify_email');
          const queryParams: Record<string, string> = { email: this.email };
          if (this.nextPath) queryParams['next'] = this.nextPath;
          this.router.navigate(['/auth/sign-in'], { queryParams });
        } else {
          this.errorMessage = 'Verification did not complete. Try the code again.';
        }
      },
      error: (err: Error) => {
        this.loading = false;
        this.errorMessage = this.friendlyError(err);
      },
    });
  }

  onResend(): void {
    if (!this.email || this.resending) return;
    this.resending = true;
    this.errorMessage = '';
    this.infoMessage = '';

    this.cognito.resendCode(this.email).subscribe({
      next: () => {
        this.resending = false;
        this.infoMessage = 'A new code is on its way.';
      },
      error: (err: Error) => {
        this.resending = false;
        this.errorMessage = this.friendlyError(err);
      },
    });
  }

  private friendlyError(err: Error): string {
    // Amplify v6 errors carry the Cognito exception name in `err.name`,
    // not in `err.message`. Test both so we don't fall through to the
    // generic catch-all silently.
    const name = (err as { name?: string }).name || '';
    const msg = err.message || '';
    const both = `${name} ${msg}`;
    if (/CodeMismatchException/i.test(both)) return 'That code is incorrect.';
    if (/ExpiredCodeException/i.test(both))
      return 'That code expired or was wrong. Request a new one.';
    if (/LimitExceededException/i.test(both))
      return 'Too many attempts. Please wait and try again.';
    if (/NotAuthorizedException/i.test(both)) {
      if (/already confirmed/i.test(msg)) return 'Already confirmed — go sign in.';
      return msg || 'Not authorized.';
    }
    if (/UserNotFoundException/i.test(both)) return 'No account for that email.';
    // Fallback: surface the raw error so we can diagnose it.
    return msg ? `${name ? name + ': ' : ''}${msg}` : 'Something went wrong. Please try again.';
  }
}
