/**
 * Stock-avatar color swatches. Each swatch maps to one Xomware app's
 * primary brand color. Users pick a swatch in the EditProfileModal and
 * the stock SVG (assets/img/xomware-user.svg) is tinted to that hex via
 * CSS color.
 */
export interface AvatarSwatch {
  hex: string;
  label: string;
}

export const AVATAR_SWATCHES: readonly AvatarSwatch[] = [
  { hex: '#00b4d8', label: 'Cyan' },         // Xomware
  { hex: '#ff6b6b', label: 'Coral' },        // Xom Appétit
  { hex: '#9c0abf', label: 'Purple' },       // Xomify
  { hex: '#ff6b35', label: 'Orange' },       // XomCloud
  { hex: '#00ffab', label: 'Mint' },         // Xomper
  { hex: '#34C759', label: 'Green' },        // XomFit
  { hex: '#C8102E', label: 'Crimson' },      // Sun God Derby
  { hex: '#FFB800', label: 'Amber' },        // Float
];

/** App-default for xomware.com — highlighted swatch when no stock color set. */
export const APP_DEFAULT_AVATAR_COLOR = '#00b4d8';
