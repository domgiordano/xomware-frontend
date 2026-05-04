import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { CognitoService } from '../../../services/cognito.service';
import { ProfileService } from '../../../services/profile.service';
import { UsersService } from '../../../services/users.service';
import {
  ProfileVisibility,
  UserProfile,
} from '../../../models/user.model';
import { AvatarChoice } from '../../avatar-picker/avatar-picker.component';

const MAX_DISPLAY_NAME = 50;
const HANDLE_REGEX = /^[a-z0-9_]{3,20}$/;
const RESERVED_HANDLES = new Set([
  'admin', 'system', 'xomware', 'xomappetit', 'support',
  'chef', 'diner', 'help', 'about', 'privacy', 'terms',
  'api', 'auth', 'profile', 'login', 'signin', 'signup',
  'me', 'you', 'user', 'users',
]);

function handleValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value as string | null)?.trim().toLowerCase() ?? '';
  if (!value) return null; // optional — empty is allowed
  if (!HANDLE_REGEX.test(value)) return { pattern: true };
  if (RESERVED_HANDLES.has(value)) return { reserved: true };
  return null;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  readonly profile$: Observable<UserProfile | null>;
  readonly editForm: FormGroup;

  editOpen = false;
  saving = false;
  errorMessage = '';

  /** Pending avatar choice (photo URL or stock color) the user hasn't saved yet. */
  pendingAvatarChoice: AvatarChoice | null = null;

  private profileSub?: Subscription;
  private currentProfile: UserProfile | null = null;

  constructor(
    public cognito: CognitoService,
    private profileService: ProfileService,
    private users: UsersService,
    private fb: FormBuilder,
    private router: Router,
  ) {
    this.profile$ = this.profileService.profile$;
    this.editForm = this.fb.group({
      preferredUsername: ['', [handleValidator]],
      displayName: [
        '',
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(MAX_DISPLAY_NAME),
        ],
      ],
      profileVisibility: ['public' as ProfileVisibility, Validators.required],
    });
  }

  get handleErrorMessage(): string {
    const ctrl = this.editForm.get('preferredUsername');
    if (!ctrl) return '';
    if (ctrl.hasError('pattern')) return '3–20 lowercase letters, numbers, or underscores.';
    if (ctrl.hasError('reserved')) return 'That handle is reserved. Pick another.';
    if (ctrl.hasError('taken')) return 'That handle is already taken.';
    return 'Invalid handle.';
  }

  ngOnInit(): void {
    this.profileSub = this.profileService.profile$.subscribe(
      (p) => (this.currentProfile = p),
    );
    // Refresh on enter — covers the case where the user landed here mid-session
    // before the BehaviorSubject was primed.
    if (!this.profileService.currentProfile) {
      this.profileService.refresh();
    }
  }

  ngOnDestroy(): void {
    this.profileSub?.unsubscribe();
  }

  /** Display name fallback chain when the API hasn't loaded yet. */
  fallbackDisplayName(profile: UserProfile | null): string {
    if (profile?.displayName) return profile.displayName;
    if (profile?.preferredUsername) return profile.preferredUsername;
    return this.cognito.currentUser?.preferredUsername ?? 'You';
  }

  /** First letter for the coral avatar fallback bubble. */
  avatarInitial(profile: UserProfile | null): string {
    const source =
      profile?.displayName ??
      profile?.preferredUsername ??
      this.cognito.currentUser?.preferredUsername ??
      '?';
    return source.trim().charAt(0).toUpperCase() || '?';
  }

  openEdit(): void {
    if (!this.currentProfile) return;
    this.errorMessage = '';
    this.pendingAvatarChoice = null;
    this.editForm.reset({
      preferredUsername: this.currentProfile.preferredUsername ?? '',
      displayName: this.currentProfile.displayName ?? '',
      profileVisibility: this.currentProfile.profileVisibility ?? 'public',
    });
    this.editOpen = true;
  }

  closeEdit(): void {
    if (this.saving) return;
    this.editOpen = false;
    this.pendingAvatarChoice = null;
    this.errorMessage = '';
  }

  fieldInvalid(name: 'displayName' | 'preferredUsername'): boolean {
    const ctrl = this.editForm.get(name);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  onAvatarChoice(choice: AvatarChoice): void {
    this.pendingAvatarChoice = choice;
  }

  onSubmit(): void {
    if (this.editForm.invalid || this.saving) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.errorMessage = '';

    const { preferredUsername, displayName, profileVisibility } = this.editForm.value as {
      preferredUsername: string;
      displayName: string;
      profileVisibility: ProfileVisibility;
    };

    const payload: Record<string, unknown> = {
      displayName: displayName.trim(),
      profileVisibility,
    };
    const newHandle = (preferredUsername || '').trim().toLowerCase();
    if (newHandle && newHandle !== this.currentProfile?.preferredUsername) {
      payload['preferredUsername'] = newHandle;
    }
    if (this.pendingAvatarChoice?.kind === 'photo') {
      payload['avatarUrl'] = this.pendingAvatarChoice.url;
      payload['avatarStockColor'] = null;
    } else if (this.pendingAvatarChoice?.kind === 'stock') {
      payload['avatarStockColor'] = this.pendingAvatarChoice.color;
      payload['avatarUrl'] = null;
    }

    this.users.edit(payload).subscribe({
      next: (updated) => {
        this.profileService.setProfile(updated);
        this.saving = false;
        this.editOpen = false;
        this.pendingAvatarChoice = null;
      },
      error: (err: { status?: number; error?: { error?: string } }) => {
        this.saving = false;
        if (err?.status === 409 || err?.error?.error === 'handle_taken') {
          // Surface uniqueness collision on the field itself.
          this.editForm.get('preferredUsername')?.setErrors({ taken: true });
          this.editForm.get('preferredUsername')?.markAsTouched();
          this.errorMessage = '';
        } else {
          this.errorMessage = 'Could not save changes. Please try again.';
        }
      },
    });
  }

  signOut(): void {
    this.cognito.signOut().subscribe({
      next: () => this.router.navigateByUrl('/'),
    });
  }
}
