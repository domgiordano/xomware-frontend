import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { CognitoService } from '../../../services/cognito.service';
import { ProfileService } from '../../../services/profile.service';
import { UsersService } from '../../../services/users.service';
import {
  ProfileVisibility,
  UserProfile,
} from '../../../models/user.model';

const ALLOWED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_DISPLAY_NAME = 50;

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
  uploadingAvatar = false;
  errorMessage = '';

  /** Live-preview URL while a freshly-uploaded avatar isn't yet persisted via `edit()`. */
  pendingAvatarUrl: string | null = null;

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
    this.pendingAvatarUrl = null;
    this.editForm.reset({
      displayName: this.currentProfile.displayName ?? '',
      profileVisibility: this.currentProfile.profileVisibility ?? 'public',
    });
    this.editOpen = true;
  }

  closeEdit(): void {
    if (this.saving || this.uploadingAvatar) return;
    this.editOpen = false;
    this.pendingAvatarUrl = null;
    this.errorMessage = '';
  }

  fieldInvalid(name: 'displayName'): boolean {
    const ctrl = this.editForm.get(name);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      this.errorMessage = 'Avatar must be a PNG, JPG, or WebP image.';
      input.value = '';
      return;
    }

    this.errorMessage = '';
    this.uploadingAvatar = true;
    this.users.uploadAvatar(file).subscribe({
      next: (finalUrl) => {
        this.pendingAvatarUrl = finalUrl;
        this.uploadingAvatar = false;
        input.value = '';
      },
      error: () => {
        this.uploadingAvatar = false;
        this.errorMessage = 'Avatar upload failed. Please try again.';
        input.value = '';
      },
    });
  }

  onSubmit(): void {
    if (this.editForm.invalid || this.saving) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.errorMessage = '';

    const { displayName, profileVisibility } = this.editForm.value as {
      displayName: string;
      profileVisibility: ProfileVisibility;
    };

    const payload: Record<string, unknown> = {
      displayName: displayName.trim(),
      profileVisibility,
    };
    if (this.pendingAvatarUrl) {
      payload['avatarUrl'] = this.pendingAvatarUrl;
    }

    this.users.edit(payload).subscribe({
      next: (updated) => {
        this.profileService.setProfile(updated);
        this.saving = false;
        this.editOpen = false;
        this.pendingAvatarUrl = null;
      },
      error: () => {
        this.saving = false;
        this.errorMessage = 'Could not save changes. Please try again.';
      },
    });
  }

  signOut(): void {
    this.cognito.signOut().subscribe({
      next: () => this.router.navigateByUrl('/'),
    });
  }
}
