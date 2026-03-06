import { inject }           from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService }     from '../services/auth/auth.service';

/** Redirects authenticated users away from guest-only pages (e.g. landing). */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.isLoggedIn()) return true;
  return inject(Router).createUrlTree(['/feed']);
};
