import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Thin GA4 wrapper. Loads the gtag.js script lazily on first use when
 * `environment.ga4MeasurementId` is set; no-ops otherwise.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private loaded = false;
  private readonly measurementId = environment.ga4MeasurementId;

  private ensureLoaded(): boolean {
    if (!this.measurementId) return false;
    if (this.loaded) return true;
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    // gtag must use `arguments`, not rest, for GA4 to bind properly.
    window.gtag = function gtag(): void {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', this.measurementId, { send_page_view: true });
    this.loaded = true;
    return true;
  }

  track(event: string, params: Record<string, unknown> = {}): void {
    if (!this.ensureLoaded() || !window.gtag) return;
    window.gtag('event', event, params);
  }

  identify(userId: string): void {
    if (!this.ensureLoaded() || !window.gtag || !this.measurementId) return;
    window.gtag('config', this.measurementId, { user_id: userId });
  }
}
