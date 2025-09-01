// app/guards/project-list.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { WarningDialogComponent } from '../components/warning-dialog/warning-dialog.component';

export const ProjectListGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const userService = inject(UserService);
  const router = inject(Router);
  const dialog = inject(MatDialog);

  // Allow Super Admins and Admins to see all projects
  if (authService.isSuperAdmin() || authService.isAdmin()) {
    return true;
  }

  const requestedDivisionCode = route.queryParamMap.get('division');

  // If a user tries to access the page without a division query param,
  // we redirect them to their own division's page.
  if (!requestedDivisionCode) {
    return userService.getCurrentUserDivision().pipe(
      map(userDivision => {
        if (userDivision) {
          return router.createUrlTree(['/project-list'], { queryParams: { division: userDivision.code, status: route.queryParamMap.get('status'), year: route.queryParamMap.get('year') } });
        }
        return false;
      })
    );
  }

  // Check if the requested division matches the user's division
  return userService.getCurrentUserDivision().pipe(
    map(userDivision => {
      if (userDivision && userDivision.code === requestedDivisionCode) {
        return true;
      }

      // If division doesn't match, show a warning and redirect
      const dialogRef = dialog.open(WarningDialogComponent, {
        width: '350px',
        data: {
          title: 'Access Denied',
          message: 'Warning: You do not have permission to access this division.'
        }
      });

      dialogRef.afterClosed().subscribe(() => {
        if (userDivision) {
          router.navigate(['/project-list'], { queryParams: { division: userDivision.code } });
        } else {
          router.navigate(['/project-dashboard']);
        }
      });

      return false;
    })
  );
};
