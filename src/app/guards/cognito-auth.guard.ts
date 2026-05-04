import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { CognitoService } from '../services/cognito.service';

/**
 * Gate routes behind a valid Cognito session.
 *
 * Waits for `CognitoService.isReady$` so the initial paint never flashes
 * protected content (e.g. the landing app cards) before the redirect fires.
 * Anonymous visitors are bounced to `/auth/sign-in?next=<requested-url>`.
 */
export const cognitoAuthGuard: CanActivateFn = async (_route, state) => {
  const cognito = inject(CognitoService);
  const router = inject(Router);

  // Wait for the initial session check to settle — don't gate on stale state.
  await firstValueFrom(cognito.isReady$.pipe(filter((ready) => ready), take(1)));

  if (cognito.isAuthenticated()) {
    return true;
  }

  const next = encodeURIComponent(state.url);
  return router.parseUrl(`/auth/sign-in?next=${next}`);
};
