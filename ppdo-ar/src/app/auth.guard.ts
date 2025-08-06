import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from './services/auth.service'; // Adjust path as needed

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    // Return an observable boolean
    return this.authService.isAuthenticated$.pipe(
      // take(1) ensures the observable completes after emitting one value,
      // which is required for a guard.
      take(1),
      // map transforms the emitted boolean value (the auth status)
      map(isAuthenticated => {
        if (isAuthenticated) {
          // If the user is authenticated, allow access
          return true;
        } else {
          // If not authenticated, redirect to the login page
          this.router.navigate(['/login']);
          return false;
        }
      })
    );
  }
}
