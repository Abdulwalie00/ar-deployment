import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Keeps signed-in users away from the login page. */
export const GuestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.hasValidToken()
    ? router.createUrlTree(['/project-dashboard'])
    : true;
};
