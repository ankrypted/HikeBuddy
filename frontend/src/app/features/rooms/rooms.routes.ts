import { Routes } from '@angular/router';

export const ROOMS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./rooms-list/rooms-list.component').then(m => m.RoomsListComponent),
    title: 'Rooms — HikeBuddy',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./room-create/room-create.component').then(m => m.RoomCreateComponent),
    title: 'Create Room — HikeBuddy',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./room-detail/room-detail.component').then(m => m.RoomDetailComponent),
    title: 'Room — HikeBuddy',
  },
];
