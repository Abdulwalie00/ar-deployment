import { Injectable } from '@angular/core';
import { CanActivate, Router, RouterStateSnapshot, ActivatedRouteSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from './services/auth.service'; // Adjust path as needed

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.authService.isAuthenticated$.pipe(
      // take(1) ensures the observable completes after emitting one value,
      // which is required for a guard.
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated && this.authService.hasValidToken()) {
          return true;
        }
        // Send the user to login, remembering the page they asked for so
        // they land back on it after signing in.
        return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
      })
    );
  }
}
