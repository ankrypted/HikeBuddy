import { Routes }      from '@angular/router';
import { INSIDE_SHELL } from './shared/tokens/shell.token';

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
  // /favorites is now under the dashboard shell; redirect old URL so bookmarks still work
  {
    path: 'favorites',
    redirectTo: '/dashboard/favorites',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard-shell.component').then(m => m.DashboardShellComponent),
    title: 'Dashboard — HikeBuddy',
    // INSIDE_SHELL=true is visible to every component loaded under this route tree
    providers: [{ provide: INSIDE_SHELL, useValue: true }],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'favorites',
        loadComponent: () =>
          import('./features/favorites/favorites.component').then(m => m.FavoritesComponent),
        title: 'Favourites — HikeBuddy',
      },
      {
        path: 'my-trails',
        loadComponent: () =>
          import('./features/my-trails/my-trails.component').then(m => m.MyTrailsComponent),
        title: 'My Trails — HikeBuddy',
      },
      {
        path: 'trails',
        loadChildren: () =>
          import('./features/trails/trails.routes').then(m => m.TRAILS_ROUTES),
        title: 'Trails — HikeBuddy',
      },
    ],
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
