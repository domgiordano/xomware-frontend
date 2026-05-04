import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CognitoService } from '../../../services/cognito.service';
import { AnalyticsService } from '../../../services/analytics.service';

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
const RESERVED_USERNAMES = new Set([
  'admin',
  'system',
  'xomappetit',
  'chef',
  'diner',
  'xomware',
  'support',
]);

function preferredUsernameValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value as string | null)?.trim() ?? '';
  if (!value) return { required: true };
  if (!USERNAME_REGEX.test(value)) return { pattern: true };
  if (RESERVED_USERNAMES.has(value.toLowerCase())) return { reserved: true };
  return null;
}

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent {
  readonly form: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private cognito: CognitoService,
    private analytics: AnalyticsService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      preferredUsername: ['', [preferredUsernameValidator]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  fieldInvalid(name: 'preferredUsername' | 'email' | 'password'): boolean {
    const ctrl = this.form.get(name);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  usernameError(): string | null {
    const ctrl = this.form.get('preferredUsername');
    if (!ctrl || !this.fieldInvalid('preferredUsername')) return null;
    if (ctrl.hasError('required')) return 'Choose a username.';
    if (ctrl.hasError('pattern'))
      return '3–20 lowercase letters, numbers, or underscores.';
    if (ctrl.hasError('reserved')) return 'That username is reserved. Try another.';
    return 'Invalid username.';
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    const { email, password, preferredUsername } = this.form.value as {
      email: string;
      password: string;
      preferredUsername: string;
    };

    this.cognito.signUp(email, password, preferredUsername).subscribe({
      next: ({ username }) => {
        this.analytics.track('sign_up', { method: 'cognito' });
        // Pass the opaque Username (UUID) to verify so confirmSignUp can
        // address the user directly — email aliases aren't reliable on
        // unconfirmed accounts (multiple unconfirmed users can share an
        // email; alias-resolution returns ambiguous and 400s the verify).
        this.router.navigate(['/auth/verify'], {
          queryParams: { email, username },
        });
      },
      error: (err: Error) => {
        this.loading = false;
        this.errorMessage = this.friendlyError(err);
      },
    });
  }

  onGoogleSignIn(): void {
    // Phase 4: kick off the Google OAuth redirect through Cognito Hosted UI.
    // The PreSignUp Lambda links to an existing local account if one exists.
    if (this.loading) return;
    this.loading = true;
    this.errorMessage = '';
    this.analytics.track('sign_up_initiate', { method: 'google' });
    this.cognito.signInWithGoogle().subscribe({
      // No `next` handler needed — Amplify navigates the page to Google.
      error: (err: Error) => {
        this.loading = false;
        this.errorMessage = this.friendlyError(err);
      },
    });
  }

  private friendlyError(err: Error): string {
    const name = (err as { name?: string }).name || '';
    const msg = err.message || '';
    const both = `${name} ${msg}`;
    if (/UsernameExistsException/i.test(both))
      return 'An account already exists for that email.';
    if (/InvalidPasswordException/i.test(both))
      return 'Password does not meet the requirements.';
    if (/InvalidParameterException/i.test(both))
      return 'One of the fields is invalid. Please check and try again.';
    return msg ? `${name ? name + ': ' : ''}${msg}` : 'Something went wrong. Please try again.';
  }
}
