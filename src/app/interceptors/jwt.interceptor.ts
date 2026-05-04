import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { CognitoService } from '../services/cognito.service';
import { environment } from '../../environments/environment';

/**
 * Attaches the Cognito ID token as a Bearer header on calls to the shared
 * Xomware API (`apiBaseUrl`). Skips presigned S3 PUTs (those carry their own
 * signature in the URL — adding Authorization breaks the signature check).
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const isApiCall =
    req.url.startsWith(environment.apiBaseUrl) ||
    req.url.startsWith(environment.usersApiUrl);
  if (!isApiCall) {
    return next(req);
  }

  const cognito = inject(CognitoService);
  return from(cognito.getJwt()).pipe(
    switchMap((token) => {
      if (!token) {
        return next(req);
      }
      const authed = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
      return next(authed);
    }),
  );
};
