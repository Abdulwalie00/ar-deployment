// app/guards/division.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { WarningDialogComponent } from '../components/warning-dialog/warning-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class DivisionGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private dialog: MatDialog // Inject MatDialog
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    const requestedDivisionCode = route.paramMap.get('divisionCode');

    if (!requestedDivisionCode) {
      return this.router.createUrlTree(['/project-dashboard']);
    }

    if (this.authService.isAdmin() || this.authService.isSuperAdmin()) {
      return true;
    }

    return this.userService.getCurrentUserDivision().pipe(
      map(userDivision => {
        if (userDivision && userDivision.code === requestedDivisionCode) {
          return true; // Access granted
        }

        // If division doesn't match, open the dialog
        const dialogRef = this.dialog.open(WarningDialogComponent, {
          width: '350px',
          data: {
            title: 'Access Denied',
            message: 'Warning: You do not have permission to access this division.'
          }
        });

        // After the dialog closes, redirect the user
        dialogRef.afterClosed().subscribe(() => {
          this.router.navigate(['/project-division', userDivision.code]);
        });

        return false; // Block initial navigation
      })
    );
  }
}
