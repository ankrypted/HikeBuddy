import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then(m => m.LandingComponent),
    title: 'HikeBuddy — Discover Epic Trails',
  },
  {
    path: 'trails',
    loadChildren: () =>
      import('./features/trails/trails.routes').then(m => m.TRAILS_ROUTES),
    title: 'Trails — HikeBuddy',
  },
  {
    path: 'gallery',
    loadComponent: () =>
      import('./features/gallery/gallery.component').then(m => m.GalleryComponent),
    title: 'Gallery — HikeBuddy',
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./features/contact/contact.component').then(m => m.ContactComponent),
    title: 'Contact — HikeBuddy',
  },
  {
    path: 'favorites',
    loadComponent: () =>
      import('./features/favorites/favorites.component').then(m => m.FavoritesComponent),
    // canActivate: [authGuard],  — uncomment when JWT is ready
    title: 'Favourites — HikeBuddy',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Dashboard — HikeBuddy',
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
