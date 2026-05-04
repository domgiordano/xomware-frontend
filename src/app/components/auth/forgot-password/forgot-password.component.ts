import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CognitoService } from '../../../services/cognito.service';

type Step = 'request' | 'confirm';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  step: Step = 'request';
  loading = false;
  errorMessage = '';
  infoMessage = '';

  readonly requestForm: FormGroup;
  readonly confirmForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private cognito: CognitoService,
    private router: Router,
  ) {
    this.requestForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
    this.confirmForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  fieldInvalid(form: FormGroup, name: string): boolean {
    const ctrl = form.get(name);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  get email(): string {
    return (this.requestForm.value as { email: string }).email;
  }

  onRequest(): void {
    if (this.requestForm.invalid || this.loading) {
      this.requestForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.cognito.startPasswordReset(this.email).subscribe({
      next: () => {
        this.loading = false;
        this.infoMessage = 'Check your email for a 6-digit code.';
        this.step = 'confirm';
      },
      error: (err: Error) => {
        this.loading = false;
        this.errorMessage = this.friendlyError(err);
      },
    });
  }

  onConfirm(): void {
    if (this.confirmForm.invalid || this.loading) {
      this.confirmForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    const { code, newPassword } = this.confirmForm.value as {
      code: string;
      newPassword: string;
    };
    this.cognito.confirmPasswordReset(this.email, code, newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/auth/sign-in'], {
          queryParams: { email: this.email },
        });
      },
      error: (err: Error) => {
        this.loading = false;
        this.errorMessage = this.friendlyError(err);
      },
    });
  }

  private friendlyError(err: Error): string {
    const msg = err.message || '';
    if (/UserNotFoundException/i.test(msg))
      return 'No account found for that email.';
    if (/CodeMismatchException/i.test(msg)) return 'That code is incorrect.';
    if (/ExpiredCodeException/i.test(msg))
      return 'That code expired — request a new one.';
    if (/InvalidPasswordException/i.test(msg))
      return 'Password does not meet the requirements.';
    if (/LimitExceededException/i.test(msg))
      return 'Too many attempts. Please wait and try again.';
    return 'Something went wrong. Please try again.';
  }
}
