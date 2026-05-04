import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CognitoService } from '../../../services/cognito.service';
import { AnalyticsService } from '../../../services/analytics.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent {
  readonly form: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private cognito: CognitoService,
    private analytics: AnalyticsService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  fieldInvalid(name: 'email' | 'password'): boolean {
    const ctrl = this.form.get(name);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    const { email, password } = this.form.value as { email: string; password: string };

    this.cognito.signIn(email, password).subscribe({
      next: () => {
        this.analytics.track('login', { method: 'cognito' });
        const redirect = this.route.snapshot.queryParamMap.get('redirect') ?? '/';
        this.router.navigateByUrl(redirect);
      },
      error: (err: Error) => {
        this.loading = false;
        if (err.message === 'CONFIRM_SIGN_UP') {
          this.router.navigate(['/auth/verify'], { queryParams: { email } });
          return;
        }
        this.errorMessage = this.friendlyError(err);
      },
    });
  }

  onGoogleSignIn(): void {
    // Phase 4 stub — UI present, click is a no-op so the layout is final but
    // we don't kick off OAuth until Google is registered as a federated IdP.
    this.errorMessage = 'Google sign-in is coming soon.';
  }

  private friendlyError(err: Error): string {
    const msg = err.message || '';
    if (/NotAuthorizedException|Incorrect/i.test(msg))
      return 'Email or password is incorrect.';
    if (/UserNotFoundException/i.test(msg)) return 'No account found for that email.';
    if (/UserNotConfirmedException/i.test(msg))
      return 'Please verify your email before signing in.';
    if (/network/i.test(msg)) return 'Network error — check your connection and try again.';
    return 'Something went wrong. Please try again.';
  }
}
