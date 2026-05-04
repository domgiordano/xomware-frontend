import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type AdminEventType = 'signin' | 'signup';

export interface AdminEvent {
  eventId: string;
  eventType: AdminEventType;
  eventTime: string;
  eventDate: string;
  userId: string;
  email: string;
  identityProvider: string;
  appClientId: string;
}

export interface EventsListRequest {
  date?: string;
  limit?: number;
  cursor?: string;
}

export interface EventsListResponse {
  date: string;
  items: AdminEvent[];
  nextCursor?: string;
}

export interface CostServiceLine {
  service: string;
  amount: number;
  unit: string;
}

export interface CostSummaryRequest {
  startDate?: string;
  endDate?: string;
}

export interface CostSummaryResponse {
  start: string;
  end: string;
  total: number;
  currency: string;
  services: CostServiceLine[];
  cached: boolean;
}

/**
 * Wraps the admin endpoints exposed by the shared Xomware API. All endpoints
 * are POST + JSON; the JWT is attached automatically by `jwtInterceptor` and
 * the backend rejects (403) requests where the token's `cognito:groups`
 * claim is missing the `admin` group.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly baseUrl = `${environment.usersApiUrl}/admin`;

  constructor(private http: HttpClient) {}

  listEvents(body: EventsListRequest = {}): Observable<EventsListResponse> {
    return this.http.post<EventsListResponse>(`${this.baseUrl}/events-list`, body);
  }

  costSummary(body: CostSummaryRequest = {}): Observable<CostSummaryResponse> {
    return this.http.post<CostSummaryResponse>(`${this.baseUrl}/cost-summary`, body);
  }
}
