/**
 * Shared user types for the xomware-users service (`api.xomware.com/users/*`).
 *
 * Mirrors the API contract documented in the auth Phase 3 plan. Same shapes
 * are consumed by other Xomware frontends (xomappetit, xomify, etc.) so keep
 * this file in lock-step with the backend.
 */

export type ProfileVisibility = 'public' | 'private';

/**
 * Full profile returned by `POST /users/me` and `POST /users/edit`. Owned by
 * the signed-in user — includes private fields (email, raw `userId`).
 */
export interface UserProfile {
  userId: string;
  email: string;
  preferredUsername: string;
  displayName: string;
  avatarUrl: string | null;
  /** Hex color (`#rrggbb`) for the stock SVG avatar; null when using uploaded photo or app default. */
  avatarStockColor: string | null;
  /** Recently-used avatar URLs (most recent first, capped at 6). */
  avatarHistory: string[];
  profileVisibility: ProfileVisibility;
  bio?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Public-facing slice returned by `POST /users/get-by-handle`. Used to render
 * other users' profiles — never exposes the email or any private data.
 */
export interface MinimalUser {
  userId: string;
  preferredUsername: string;
  displayName: string;
  avatarUrl: string | null;
  avatarStockColor: string | null;
  profileVisibility: ProfileVisibility;
}

/** Whitelist of fields the user can self-edit via `POST /users/edit`. */
export interface EditableFields {
  preferredUsername: string;
  displayName: string;
  profileVisibility: ProfileVisibility;
  avatarUrl: string | null;
  /** Hex `#rrggbb` for the stock SVG. Mutually exclusive with avatarUrl. */
  avatarStockColor: string | null;
  bio: string | null;
}

/** S3 presigned upload pair returned by `POST /users/presign-avatar`. */
export interface PresignAvatarResponse {
  uploadUrl: string;
  finalUrl: string;
}
