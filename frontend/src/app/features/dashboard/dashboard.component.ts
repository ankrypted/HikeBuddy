import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink }               from '@angular/router';
import { AuthService }              from '../../core/services/auth/auth.service';
import { FavoritesService }         from '../../core/services/favorites/favorites.service';
import { CompletedTrailsService }   from '../../core/services/completed-trails/completed-trails.service';

@Component({
  selector: 'hb-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl:    './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly authService      = inject(AuthService);
  private readonly favService       = inject(FavoritesService);
  private readonly completedService = inject(CompletedTrailsService);

  readonly currentUser     = this.authService.currentUser;
  readonly savedCount      = this.favService.count;
  readonly completedCount  = this.completedService.count;
  readonly avatarFailed    = signal(false);

  onAvatarError(): void {
    this.avatarFailed.set(true);
  }
}
