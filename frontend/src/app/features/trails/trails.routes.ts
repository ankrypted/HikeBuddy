import { Routes } from '@angular/router';

export const TRAILS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./trails-list/trails-list.component').then(m => m.TrailsListComponent),
    title: 'Browse Trails — HikeBuddy',
  },
  {
    path: ':slug',
    loadComponent: () =>
      import('./trail-detail/trail-detail.component').then(m => m.TrailDetailComponent),
    title: 'Trail — HikeBuddy',
  },
];
