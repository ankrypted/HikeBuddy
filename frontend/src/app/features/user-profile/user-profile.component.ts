import {
  Component, Input, OnInit,
  ChangeDetectionStrategy, signal, computed, inject,
} from '@angular/core';
import { RouterLink }              from '@angular/router';
import { NavbarComponent }         from '../../core/layout/navbar/navbar.component';
import { SceneBackgroundComponent } from '../../shared/components/scene-background/scene-background.component';
import { UserService }             from '../../core/services/user/user.service';
import { AuthService }             from '../../core/services/auth/auth.service';
import { PublicUserDto, ActivityEvent } from '../../shared/models/public-user.dto';
import { DOCUMENT }               from '@angular/common';

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
  private readonly document    = inject(DOCUMENT);

  readonly profile    = signal<PublicUserDto | null>(null);
  readonly loading    = signal(true);
  readonly notFound   = signal(false);
  readonly subscribed = signal(false);
  readonly copied     = signal(false);

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

  toggleSubscribe(): void {
    this.subscribed.update(v => !v);
  }

  shareProfile(): void {
    const url = this.document.location.href;
    if (navigator.share) {
      navigator.share({ title: `${this.profile()?.username} on HikeBuddy`, url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      });
    }
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

  activityLabel(event: ActivityEvent): string {
    switch (event.type) {
      case 'completed': return 'Completed';
      case 'reviewed':  return 'Reviewed';
      case 'saved':     return 'Saved';
    }
  }

  formatActivityDate(iso: string): string {
    const date = new Date(iso);
    const now   = new Date();
    const days  = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7)  return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }
}
