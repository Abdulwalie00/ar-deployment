import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import {jwtDecode} from 'jwt-decode';
import {environment} from '../environment/environment';
import { ToastService } from './toast.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  private userRolesSubject = new BehaviorSubject<string[]>(this.getRolesFromToken());
  private expiryTimer?: ReturnType<typeof setTimeout>;

  constructor(private http: HttpClient, private router: Router, private toast: ToastService) {
    // Clear a token that expired while the app was closed, and schedule
    // automatic sign-out for the one that is still valid.
    if (this.getToken() && !this.hasValidToken()) {
      this.clearSession();
      this.toast.warning('Your session has expired', 'Please sign in again to continue.');
    } else {
      this.scheduleExpiry();
    }
  }

  login(credentials: { username: string, password: string }): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(environment.apiUrl + 'auth/login', credentials).pipe(
      tap(response => {
        localStorage.setItem('authToken', response.token);
        this.isAuthenticatedSubject.next(true);
        this.userRolesSubject.next(this.getRolesFromToken()); // Update roles on login
        this.scheduleExpiry();
      })
    );
  }

  logout(): void {
    this.clearSession();
  }

  /**
   * Signs the user out because their session is no longer valid and sends
   * them to the login page, remembering where they were.
   */
  expireSession(): void {
    if (!this.getToken()) {
      return;
    }
    this.clearSession();
    this.toast.warning('Your session has expired', 'Please sign in again to continue.');

    const returnUrl = this.router.url;
    this.router.navigate(['/login'], {
      queryParams: returnUrl && !returnUrl.startsWith('/login') ? { returnUrl } : undefined
    });
  }

  getRoles(): string[] {
    return this.getRolesFromToken();
  }

  verifyPassword(password: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}auth/verify-password`, { password });
  }

  /**
   * ADD THIS METHOD
   * Gets the primary role of the user.
   */
  getUserRole(): string {
    const roles = this.getRoles();
    return roles.length > 0 ? roles[0] : ''; // Return the first role or an empty string
  }

  isSuperAdmin(): boolean {
    return this.getRoles().includes('ROLE_SUPERADMIN');
  }

  isAdmin(): boolean {
    return this.getRoles().includes('ROLE_ADMIN');
  }

  getUsername(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      return decoded.sub; // 'sub' is standard for subject (username) in JWT
    } catch (e) {
      console.error('Error decoding token', e);
      return null;
    }
  }

  get isAuthenticated$(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  get userRoles$(): Observable<string[]> {
    return this.userRolesSubject.asObservable();
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  hasValidToken(): boolean {
    const expiresAt = this.getTokenExpiry();
    return !!this.getToken() && (expiresAt === null || expiresAt > Date.now());
  }

  private clearSession(): void {
    localStorage.removeItem('authToken');
    clearTimeout(this.expiryTimer);
    this.isAuthenticatedSubject.next(false);
    this.userRolesSubject.next([]);
  }

  private scheduleExpiry(): void {
    clearTimeout(this.expiryTimer);
    const expiresAt = this.getTokenExpiry();
    if (expiresAt === null) {
      return;
    }
    // setTimeout overflows above ~24.8 days; tokens here last hours.
    const delay = Math.min(expiresAt - Date.now(), 2_147_483_647);
    this.expiryTimer = setTimeout(() => this.expireSession(), Math.max(delay, 0));
  }

  /** Expiry time of the stored token in ms, or null if it has none. */
  private getTokenExpiry(): number | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded: { exp?: number } = jwtDecode(token);
      return decoded.exp ? decoded.exp * 1000 : null;
    } catch {
      return 0; // Unreadable token: treat as already expired.
    }
  }

  private getRolesFromToken(): string[] {
    const token = this.getToken();
    if (!token) return [];

    try {
      const decoded: any = jwtDecode(token);
      // Handle both string[] and object[] role formats
      const roles = decoded.roles || [];

      if (roles.length > 0 && typeof roles[0] === 'object') {
        return roles.map((r: any) => r.authority || r.role);
      }
      return roles;
    } catch (e) {
      console.error('Error decoding token', e);
      return [];
    }
  }
}
