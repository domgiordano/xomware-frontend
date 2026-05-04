import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { fetchAuthSession } from 'aws-amplify/auth';
import { firstValueFrom } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { CognitoService } from '../services/cognito.service';

/**
 * Gate routes behind Cognito group membership in `admin`.
 *
 * Mirrors `cognitoAuthGuard`: waits for `isReady$` so we never read stale
 * session state on first paint. Anonymous visitors and signed-in users
 * without the `admin` group are bounced to `/` (silent — the link is not
 * advertised on the landing page, so a soft redirect is the friendlier UX).
 */
export const adminGuard: CanActivateFn = async () => {
  const cognito = inject(CognitoService);
  const router = inject(Router);

  await firstValueFrom(cognito.isReady$.pipe(filter((ready) => ready), take(1)));

  if (!cognito.isAuthenticated()) {
    return router.parseUrl('/');
  }

  try {
    const session = await fetchAuthSession();
    const groupsClaim = session.tokens?.idToken?.payload?.['cognito:groups'];
    const groups = Array.isArray(groupsClaim) ? groupsClaim.map(String) : [];
    if (groups.includes('admin')) {
      return true;
    }
  } catch {
    // Fall through to redirect.
  }

  return router.parseUrl('/');
};
