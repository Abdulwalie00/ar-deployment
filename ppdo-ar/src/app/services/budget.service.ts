import { Injectable, computed, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../environment/environment';
import { AuthService } from './auth.service';

export interface ProjectBudget {
  projectId: string;
  budget: number | null;
  /** True when the user may not see this project's budget. */
  restricted: boolean;
}

export interface BudgetHistoryEntry {
  action: 'VIEW' | 'EXPORT' | 'CHANGE' | 'UNLOCK' | 'UNLOCK_FAILED' | 'DENIED';
  username: string;
  oldValue: number | null;
  newValue: number | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

/** Server response when the budget unlock has expired or was never done. */
export const BUDGET_LOCKED_STATUS = 428;

/** The password check succeeded but the server is too old to issue budget tokens. */
export class BudgetServerOutdatedError extends Error {
  constructor() {
    super('The server did not return a budget token. It needs to be restarted or updated.');
    this.name = 'BudgetServerOutdatedError';
  }
}

/**
 * Budget figures are never part of normal project data. They are fetched here,
 * only after the user re-enters their password, which yields a short-lived
 * token. The token lives in memory only: a reload or sign-out locks budgets again.
 */
@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private readonly token = signal<string | null>(null);
  private readonly expiresAt = signal<number>(0);
  private lockTimer?: ReturnType<typeof setTimeout>;

  /** True while budgets are unlocked. */
  readonly isUnlocked = computed(() => !!this.token() && this.expiresAt() > Date.now());
  /** When the current unlock ends (ms since epoch), or 0. */
  readonly unlockedUntil = computed(() => (this.isUnlocked() ? this.expiresAt() : 0));

  constructor(private http: HttpClient, authService: AuthService) {
    authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (!isAuthenticated) {
        this.lock();
      }
    });
  }

  /** Re-checks the password and unlocks budgets for a few minutes. */
  unlock(password: string): Observable<void> {
    return this.http
      .post<{ budgetToken: string; expiresInSeconds: number }>(`${environment.apiUrl}auth/verify-password`, { password })
      .pipe(
        tap(response => {
          if (!response?.budgetToken || !response.expiresInSeconds) {
            // Password was accepted, but the server did not issue a budget token:
            // it is running an older version that predates budget protection.
            throw new BudgetServerOutdatedError();
          }
          const expires = Date.now() + response.expiresInSeconds * 1000;
          this.token.set(response.budgetToken);
          this.expiresAt.set(expires);
          clearTimeout(this.lockTimer);
          this.lockTimer = setTimeout(() => this.lock(), response.expiresInSeconds * 1000);
        }),
        map(() => undefined)
      );
  }

  lock(): void {
    clearTimeout(this.lockTimer);
    this.token.set(null);
    this.expiresAt.set(0);
  }

  getBudget(projectId: string): Observable<ProjectBudget> {
    return this.http
      .get<ProjectBudget>(`${environment.apiUrl}projects/${projectId}/budget`, { headers: this.headers() })
      .pipe(tap({ error: err => this.lockIfExpired(err) }));
  }

  /** Budgets for several projects at once (printed reports). */
  getBudgets(projectIds: string[]): Observable<Map<string, ProjectBudget>> {
    return this.http
      .post<ProjectBudget[]>(`${environment.apiUrl}projects/budgets`, { projectIds }, { headers: this.headers() })
      .pipe(
        tap({ error: err => this.lockIfExpired(err) }),
        map(list => new Map(list.map(item => [item.projectId, item])))
      );
  }

  getHistory(projectId: string): Observable<BudgetHistoryEntry[]> {
    return this.http.get<BudgetHistoryEntry[]>(`${environment.apiUrl}projects/${projectId}/budget/history`);
  }

  private headers(): HttpHeaders {
    return new HttpHeaders(this.token() ? { 'X-Budget-Token': this.token()! } : {});
  }

  private lockIfExpired(error: unknown): void {
    if (error instanceof HttpErrorResponse && error.status === BUDGET_LOCKED_STATUS) {
      this.lock();
    }
  }
}
