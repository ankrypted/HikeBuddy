import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/guest.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./login/login.component').then(m => m.LoginComponent),
    title: 'Login — HikeBuddy',
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./register/register.component').then(m => m.RegisterComponent),
    title: 'Create Account — HikeBuddy',
  },
  {
    path: 'verify-email-sent',
    loadComponent: () =>
      import('./verify-email-sent/verify-email-sent.component').then(m => m.VerifyEmailSentComponent),
    title: 'Check Your Email — HikeBuddy',
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./verify-email/verify-email.component').then(m => m.VerifyEmailComponent),
    title: 'Verify Email — HikeBuddy',
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./callback/auth-callback.component').then(m => m.AuthCallbackComponent),
    title: 'Signing in… — HikeBuddy',
  },
];
