import { Routes }      from '@angular/router';
import { INSIDE_SHELL } from './shared/tokens/shell.token';
import { guestGuard }   from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [guestGuard],
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
    path: 'map',
    loadComponent: () =>
      import('./features/map/map.component').then(m => m.MapComponent),
    title: 'Trails Map — HikeBuddy',
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
        path: 'my-reviews',
        loadComponent: () =>
          import('./features/my-reviews/my-reviews.component').then(m => m.MyReviewsComponent),
        title: 'My Reviews — HikeBuddy',
      },
      {
        path: 'achievements',
        loadComponent: () =>
          import('./features/achievements/achievements.component').then(m => m.AchievementsComponent),
        title: 'Achievements — HikeBuddy',
      },
      {
        path: 'trails',
        loadChildren: () =>
          import('./features/trails/trails.routes').then(m => m.TRAILS_ROUTES),
        title: 'Trails — HikeBuddy',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(m => m.ProfileComponent),
        title: 'Profile — HikeBuddy',
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
        title: 'Notifications — HikeBuddy',
      },
    ],
  },
  {
    path: 'feed',
    loadComponent: () =>
      import('./features/feed/feed.component').then(m => m.FeedComponent),
    title: 'Feed — HikeBuddy',
  },
  // /notifications is now under the dashboard shell; redirect old URL
  {
    path: 'notifications',
    redirectTo: '/dashboard/notifications',
    pathMatch: 'full',
  },
  {
    path: 'users/:username',
    loadComponent: () =>
      import('./features/user-profile/user-profile.component').then(m => m.UserProfileComponent),
    title: 'Hiker Profile — HikeBuddy',
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
