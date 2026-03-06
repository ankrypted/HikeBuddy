import {
  Component, Input, OnInit,
  ChangeDetectionStrategy, signal, computed, inject,
} from '@angular/core';
import { RouterLink }              from '@angular/router';
import { NavbarComponent }         from '../../core/layout/navbar/navbar.component';
import { SceneBackgroundComponent } from '../../shared/components/scene-background/scene-background.component';
import { UserService }             from '../../core/services/user/user.service';
import { AuthService }             from '../../core/services/auth/auth.service';
import { PublicUserDto }           from '../../shared/models/public-user.dto';

@Component({
  selector:         'hb-user-profile',
  standalone:       true,
  changeDetection:  ChangeDetectionStrategy.OnPush,
  imports:          [NavbarComponent, SceneBackgroundComponent, RouterLink],
  templateUrl:      './user-profile.component.html',
  styleUrl:         './user-profile.component.scss',
})
export class UserProfileComponent implements OnInit {
  @Input() username = '';   // auto-bound by withComponentInputBinding()

  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);

  readonly profile  = signal<PublicUserDto | null>(null);
  readonly loading  = signal(true);
  readonly notFound = signal(false);

  readonly currentUser  = this.authService.currentUser;
  readonly isOwnProfile = computed(() =>
    !!this.currentUser() && this.currentUser()!.username === this.profile()?.username,
  );

  ngOnInit(): void {
    this.userService.getPublicProfile(this.username).subscribe({
      next:  p  => { this.profile.set(p); this.loading.set(false); },
      error: () => { this.notFound.set(true); this.loading.set(false); },
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  initials(username: string): string {
    return username.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || '?';
  }

  formatJoinDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }

  stars(rating: number): ('filled' | 'empty')[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating) ? 'filled' : 'empty');
  }
}
