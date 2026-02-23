import { inject }                             from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService }                         from '../services/auth/auth.service';
import { UserRole }                            from '../../shared/models/user.dto';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const required: UserRole[] = route.data['roles'] ?? [];
  const hasRole = required.some(r => auth.roles().includes(r));

  return hasRole ? true : router.createUrlTree(['/']);
};

// Usage in routes.ts:
// canActivate: [authGuard, roleGuard],
// data: { roles: ['ROLE_ADMIN'] }
