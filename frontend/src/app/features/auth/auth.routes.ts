import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then(m => m.LoginComponent),
    title: 'Login — HikeBuddy',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./register/register.component').then(m => m.RegisterComponent),
    title: 'Create Account — HikeBuddy',
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./callback/auth-callback.component').then(m => m.AuthCallbackComponent),
    title: 'Signing in… — HikeBuddy',
  },
];
