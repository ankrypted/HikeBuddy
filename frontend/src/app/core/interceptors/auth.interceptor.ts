import { HttpInterceptorFn } from '@angular/common/http';
import { inject }            from '@angular/core';
import { Router }            from '@angular/router';
import { EMPTY }             from 'rxjs';
import { AuthService }       from '../services/auth/auth.service';
import { isTokenExpired }    from '../utils/jwt-decoder';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const token  = auth.accessToken();

  if (token) {
    // Proactive check: if the token is already expired, log out immediately
    // and redirect rather than sending a request we know will fail.
    if (isTokenExpired(token)) {
      auth.logout();
      router.navigate(['/auth/login'], { queryParams: { sessionExpired: 'true' } });
      return EMPTY;
    }

    return next(req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }));
  }

  return next(req);
};
