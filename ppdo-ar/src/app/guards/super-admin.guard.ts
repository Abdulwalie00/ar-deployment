import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { WarningDialogComponent } from '../components/warning-dialog/warning-dialog.component';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export const SuperAdminGuard: CanActivateFn = (route, state): Observable<boolean> | boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const dialog = inject(MatDialog);

  // Allow access if user is a Super Admin
  if (authService.isSuperAdmin()) {
    return true;
  }

  // If user is a regular Admin, show the warning dialog
  if (authService.isAdmin()) {
    const dialogRef = dialog.open(WarningDialogComponent, {
      data: {
        title: 'Access Restricted',
        message: 'You must be a Super Admin to manage user accounts.'
      },
      width: '400px',
      disableClose: true // Prevents closing by clicking outside
    });

    // After the dialog is closed, redirect them and prevent navigation
    return dialogRef.afterClosed().pipe(
      map(() => {
        router.navigate(['/project-dashboard']);
        return false; // Deny access to the route
      })
    );
  }

  // For any other role, just redirect without a dialog
  router.navigate(['/project-dashboard']);
  return false;
};
