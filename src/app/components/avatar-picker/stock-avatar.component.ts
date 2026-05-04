import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Inline-SVG version of /assets/img/xomware-user.svg so the eyes/mouth
 * (which use `currentColor`) inherit the chosen color from the parent.
 * External <img> SVGs ignore page CSS, so we have to inline the markup.
 */
@Component({
  selector: 'app-stock-avatar',
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      [attr.width]="size"
      [attr.height]="size"
      [style.color]="color"
      [style.width.px]="size"
      [style.height.px]="size"
      aria-hidden="true"
    >
      <g fill="#000">
        <circle cx="250" cy="170" r="115" />
        <path
          d="M 250,300 C 130,300 60,365 60,445 L 60,500 L 440,500 L 440,445 C 440,365 370,300 250,300 Z"
        />
      </g>
      <rect
        x="155" y="146" width="80" height="18" rx="9"
        fill="currentColor" transform="rotate(45 195 155)"
      />
      <rect
        x="155" y="146" width="80" height="18" rx="9"
        fill="currentColor" transform="rotate(-45 195 155)"
      />
      <rect
        x="265" y="146" width="80" height="18" rx="9"
        fill="currentColor" transform="rotate(45 305 155)"
      />
      <rect
        x="265" y="146" width="80" height="18" rx="9"
        fill="currentColor" transform="rotate(-45 305 155)"
      />
      <rect x="185" y="221" width="130" height="18" rx="9" fill="currentColor" />
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockAvatarComponent {
  /** Hex color for the X eyes + mouth. Silhouette stays black. */
  @Input() color = '#00b4d8';
  /** Render size in px (square). */
  @Input() size = 64;
}
