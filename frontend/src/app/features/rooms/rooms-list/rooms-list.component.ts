import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink }      from '@angular/router';
import { NavbarComponent } from '../../../core/layout/navbar/navbar.component';
import { SceneBackgroundComponent } from '../../../shared/components/scene-background/scene-background.component';
import { RoomService }     from '../../../core/services/room/room.service';
import { AuthService }     from '../../../core/services/auth/auth.service';
import { RoomSummaryDto }  from '../../../shared/models/room.dto';

@Component({
  selector:        'hb-rooms-list',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [RouterLink, NavbarComponent, SceneBackgroundComponent],
  templateUrl:     './rooms-list.component.html',
  styleUrl:        './rooms-list.component.scss',
})
export class RoomsListComponent implements OnInit {
  private readonly roomService = inject(RoomService);
  private readonly authService = inject(AuthService);

  readonly rooms   = this.roomService.myRooms;
  readonly loading = signal(true);
  readonly isLoggedIn = this.authService.isLoggedIn;

  ngOnInit(): void {
    if (this.isLoggedIn()) {
      this.roomService.loadMyRooms();
    }
    this.loading.set(false);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  initials(username: string): string {
    return username.slice(0, 2).toUpperCase();
  }
}
