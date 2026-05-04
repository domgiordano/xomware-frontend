import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, from, of, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  EditableFields,
  MinimalUser,
  PresignAvatarResponse,
  UserProfile,
} from '../models/user.model';

/**
 * Talks to the shared `xomware-users` service at `apiBaseUrl`. All endpoints
 * are POST + JSON (consistent with the rest of the Xomware backend); the JWT
 * is attached automatically by `jwtInterceptor`.
 *
 * Used by:
 *   - Profile page (getMe, edit, uploadAvatar)
 *   - Header (getMe via ProfileService)
 *   - Public lookup of other users (getByHandle) — Phase 5+ surfaces.
 */
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly baseUrl = `${environment.usersApiUrl}/users`;

  constructor(private http: HttpClient) {}

  /** The authenticated caller's full profile (includes email + private fields). */
  getMe(): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${this.baseUrl}/me`, {});
  }

  /**
   * Public-facing lookup of any user by their `@handle` (preferred username).
   * Always returns the minimal slice — never email — even for the caller.
   */
  getByHandle(handle: string): Observable<MinimalUser> {
    return this.http.post<MinimalUser>(`${this.baseUrl}/get-by-handle`, {
      handle,
    });
  }

  /**
   * Patch one or more editable fields. Backend validates `displayName`
   * length and visibility enum; surfaces errors as 4xx.
   */
  edit(fields: Partial<EditableFields>): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${this.baseUrl}/edit`, fields);
  }

  /**
   * Ask the backend for a presigned S3 PUT URL for an avatar of the given
   * MIME type. The `finalUrl` is the public CDN URL the file will be served
   * from once the PUT succeeds.
   */
  presignAvatar(contentType: string): Observable<PresignAvatarResponse> {
    return this.http.post<PresignAvatarResponse>(
      `${this.baseUrl}/presign-avatar`,
      { contentType },
    );
  }

  /**
   * End-to-end avatar upload: presign → PUT to S3 → return the final CDN URL.
   * Caller is responsible for calling `edit({ avatarUrl })` to persist it on
   * the profile (kept separate so callers can preview before saving).
   *
   * Skips the JWT interceptor on the S3 PUT (URL-signed). Sends the same
   * content type the presign was issued for — mismatches fail the signature.
   */
  uploadAvatar(file: File): Observable<string> {
    return this.presignAvatar(file.type).pipe(
      switchMap(({ uploadUrl, finalUrl }) =>
        from(
          fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
          }).then((res) => {
            if (!res.ok) {
              throw new Error(`Avatar upload failed: ${res.status}`);
            }
            return finalUrl;
          }),
        ),
      ),
      switchMap((url) => of(url)),
    );
  }
}
