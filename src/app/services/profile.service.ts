import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { CognitoService } from './cognito.service';
import { UsersService } from './users.service';
import { UserProfile } from '../models/user.model';

/**
 * In-memory cache of the signed-in user's full profile (avatar, displayName,
 * visibility, etc.). Auto-refreshes whenever Cognito reports a new auth
 * state — sign-in fetches, sign-out clears.
 *
 * Subscribe to `profile$` from the header and profile page so they stay in
 * sync after edits. After `edit()` succeeds, push the result through
 * `setProfile()` to avoid a needless refetch.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService implements OnDestroy {
  private readonly profileSubject = new BehaviorSubject<UserProfile | null>(null);
  readonly profile$: Observable<UserProfile | null> = this.profileSubject.asObservable();

  private authSub?: Subscription;

  constructor(
    private cognito: CognitoService,
    private users: UsersService,
  ) {
    this.authSub = this.cognito.user$.subscribe((user) => {
      if (user) {
        this.refresh();
      } else {
        this.profileSubject.next(null);
      }
    });
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }

  get currentProfile(): UserProfile | null {
    return this.profileSubject.value;
  }

  /** Imperatively refresh from the API. Errors are swallowed — header just stays stale. */
  refresh(): void {
    this.users.getMe().subscribe({
      next: (profile) => this.profileSubject.next(profile),
      error: () => {
        // Likely first run before backend is wired up, or transient 5xx.
        // Don't clobber any existing profile state.
      },
    });
  }

  /** Push an updated profile (e.g. after `users.edit(...)`) into the cache. */
  setProfile(profile: UserProfile): void {
    this.profileSubject.next(profile);
  }
}
