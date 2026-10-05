import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token: string | null = authService.getToken();
  const isAuthEndpoint = req.url.includes('auth/');

  const request = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      // The backend answers 401/403 once the JWT has expired. Sign the user
      // out with an explanation instead of leaving them on a broken page.
      // Auth endpoints are skipped so a wrong password is not treated as expiry.
      if (
        token &&
        !isAuthEndpoint &&
        error instanceof HttpErrorResponse &&
        (error.status === 401 || (error.status === 403 && !authService.hasValidToken()))
      ) {
        authService.expireSession();
      }
      return throwError(() => error);
    })
  );
};
