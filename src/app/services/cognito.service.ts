import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, from, map } from 'rxjs';
import {
  signIn,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  signOut,
  fetchAuthSession,
  getCurrentUser,
  signInWithRedirect,
  resetPassword,
  confirmResetPassword,
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

export interface XomUser {
  userId: string;
  username: string;
  preferredUsername?: string;
  email?: string;
}

/**
 * Wraps Amplify v6 Auth APIs for the shared `xomware-users` Cognito pool.
 *
 * Used by xomware.com sign-in/up flows. Phase 3 will extend this for the
 * admin portal (using `getJwt()` to call protected APIs).
 */
@Injectable({ providedIn: 'root' })
export class CognitoService implements OnDestroy {
  private readonly userSubject = new BehaviorSubject<XomUser | null>(null);
  private readonly readySubject = new BehaviorSubject<boolean>(false);
  private hubSub?: () => void;

  readonly user$: Observable<XomUser | null> = this.userSubject.asObservable();
  readonly isAuthenticated$: Observable<boolean> = this.user$.pipe(map((u) => !!u));
  /**
   * Emits `true` once the initial session check has settled (signed-in or not).
   * Route guards subscribe to this so the gate doesn't fire on stale `null` state
   * during the first paint and flash protected content before redirecting.
   */
  readonly isReady$: Observable<boolean> = this.readySubject.asObservable();

  constructor() {
    // Bootstrap current session on app start
    this.bootstrap();

    // React to Amplify auth events (sign-in, sign-out, OAuth redirect, token refresh)
    this.hubSub = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
        case 'signInWithRedirect':
        case 'tokenRefresh':
          this.refreshUser();
          break;
        case 'signedOut':
          this.userSubject.next(null);
          break;
      }
    });
  }

  ngOnDestroy(): void {
    this.hubSub?.();
  }

  get currentUser(): XomUser | null {
    return this.userSubject.value;
  }

  /** Synchronous check used by route guards after `isReady$` resolves. */
  isAuthenticated(): boolean {
    return this.userSubject.value !== null;
  }

  private async bootstrap(): Promise<void> {
    try {
      await this.refreshUser();
    } catch {
      // No session is fine — userSubject is already null.
    } finally {
      this.readySubject.next(true);
    }
  }

  signIn(email: string, password: string): Observable<XomUser> {
    return from(this.signInInternal(email, password));
  }

  private async signInInternal(email: string, password: string): Promise<XomUser> {
    const result = await signIn({ username: email, password });
    if (!result.isSignedIn) {
      // Surface the next step (e.g. CONFIRM_SIGN_UP, MFA) as a typed error.
      throw new Error(result.nextStep?.signInStep ?? 'SIGN_IN_INCOMPLETE');
    }
    return this.refreshUser();
  }

  signUp(
    email: string,
    password: string,
    preferredUsername: string,
  ): Observable<{ userConfirmed: boolean; username: string }> {
    // Pool config: alias_attributes = ["email"]. Cognito Username must be
    // opaque (NOT email-format). Generate a UUID. Caller stores it and
    // passes it back to confirmSignUp — alias resolution can't be used
    // for unconfirmed users, since email-uniqueness is only enforced
    // post-confirmation (a retry would otherwise create a parallel
    // unconfirmed user with the same email and break verify).
    const opaqueUsername =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return from(
      signUp({
        username: opaqueUsername,
        password,
        options: {
          userAttributes: {
            email,
          },
          // preferred_username can't be a SignUp userAttribute (alias
          // reserved for confirmed accounts). Forward via clientMetadata;
          // the PostConfirmation Lambda picks it up.
          clientMetadata: {
            preferred_username: preferredUsername,
          },
        },
      }).then((res) => ({
        userConfirmed: !!res.isSignUpComplete,
        username: opaqueUsername,
      })),
    );
  }

  confirmSignUp(email: string, code: string): Observable<boolean> {
    return from(
      confirmSignUp({ username: email, confirmationCode: code }).then(
        (res) => !!res.isSignUpComplete,
      ),
    );
  }

  resendCode(email: string): Observable<void> {
    return from(resendSignUpCode({ username: email }).then(() => undefined));
  }

  startPasswordReset(email: string): Observable<void> {
    return from(resetPassword({ username: email }).then(() => undefined));
  }

  confirmPasswordReset(email: string, code: string, newPassword: string): Observable<void> {
    return from(
      confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      }).then(() => undefined),
    );
  }

  /** Phase 4 stub — kicks off the OAuth redirect. */
  signInWithGoogle(): Observable<void> {
    return from(signInWithRedirect({ provider: 'Google' }).then(() => undefined));
  }

  signOut(): Observable<void> {
    return from(
      signOut().then(() => {
        this.userSubject.next(null);
      }),
    );
  }

  /** Returns the current id token for protected API calls. Null when signed out. */
  async getJwt(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() ?? null;
    } catch {
      return null;
    }
  }

  private async refreshUser(): Promise<XomUser> {
    try {
      const current = await getCurrentUser();
      const session = await fetchAuthSession();
      const claims = session.tokens?.idToken?.payload ?? {};
      const user: XomUser = {
        userId: current.userId,
        username: current.username,
        preferredUsername:
          (claims['preferred_username'] as string | undefined) ?? current.username,
        email: claims['email'] as string | undefined,
      };
      this.userSubject.next(user);
      return user;
    } catch {
      this.userSubject.next(null);
      throw new Error('NO_SESSION');
    }
  }

  // Helper kept for symmetry with other Xomware services that take a Subscription.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static noopSub(): Subscription {
    return new Subscription();
  }
}
