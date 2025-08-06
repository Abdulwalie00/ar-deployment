import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import {jwtDecode} from 'jwt-decode';
import {environment} from '../environment/environment';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  private userRolesSubject = new BehaviorSubject<string[]>(this.getRolesFromToken());

  constructor(private http: HttpClient) { }

  login(credentials: { username: string, password: string }): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(environment.apiUrl + 'auth/login', credentials).pipe(
      tap(response => {
        localStorage.setItem('authToken', response.token);
        this.isAuthenticatedSubject.next(true);
        this.userRolesSubject.next(this.getRolesFromToken()); // Update roles on login
      })
    );
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.isAuthenticatedSubject.next(false);
    this.userRolesSubject.next([]);
  }

  getRoles(): string[] {
    return this.getRolesFromToken();
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

  private hasToken(): boolean {
    return !!this.getToken();
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
