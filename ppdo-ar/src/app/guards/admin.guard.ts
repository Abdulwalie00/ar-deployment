import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 👇 THIS IS THE FIX 👇
  // Allow access if user is an admin OR a super admin
  if (authService.isAdmin() || authService.isSuperAdmin()) {
    return true;
  } else {
    // Redirect to a 'not-authorized' page or home page
    router.navigate(['/project-dashboard']); // or some other default page
    return false;
  }
};
