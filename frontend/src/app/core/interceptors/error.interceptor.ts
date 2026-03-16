import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject }                               from '@angular/core';
import { Router }                               from '@angular/router';
import { catchError, EMPTY, throwError }        from 'rxjs';
import { AuthService }                          from '../services/auth/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Safety net: a 401 from a non-auth endpoint means the token was rejected
      // server-side (expired, revoked, tampered). Log the user out and redirect.
      const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/register');
      if (err.status === 401 && !isAuthEndpoint && auth.isLoggedIn()) {
        auth.logout();
        router.navigate(['/auth/login'], { queryParams: { sessionExpired: 'true' } });
        return EMPTY;
      }

      console.error(`[HTTP ${err.status}]`, err.url, err.message);
      return throwError(() => err);
    }),
  );
};
