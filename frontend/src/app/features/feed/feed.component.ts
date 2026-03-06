import {
  Component, OnInit, signal, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink }              from '@angular/router';
import { NavbarComponent }         from '../../core/layout/navbar/navbar.component';
import { SceneBackgroundComponent } from '../../shared/components/scene-background/scene-background.component';
import { UserService }             from '../../core/services/user/user.service';
import { ActivityEvent }           from '../../shared/models/public-user.dto';

export interface FeedEvent extends ActivityEvent {
  username:  string;
  avatarUrl: string | null;
}

@Component({
  selector:        'hb-feed',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [NavbarComponent, SceneBackgroundComponent, RouterLink],
  templateUrl:     './feed.component.html',
  styleUrl:        './feed.component.scss',
})
export class FeedComponent implements OnInit {
  private readonly userService = inject(UserService);

  readonly feedItems = signal<FeedEvent[]>([]);
  readonly loading   = signal(true);

  ngOnInit(): void {
    this.userService.getPublicProfiles().subscribe(profiles => {
      const items: FeedEvent[] = profiles.flatMap(p =>
        p.recentActivity.map(e => ({
          ...e,
          username:  p.username,
          avatarUrl: p.avatarUrl,
        })),
      );
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      this.feedItems.set(items);
      this.loading.set(false);
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────
  initials(username: string): string {
    return username.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || '?';
  }

  activityVerb(type: ActivityEvent['type']): string {
    switch (type) {
      case 'completed': return 'completed';
      case 'reviewed':  return 'reviewed';
      case 'saved':     return 'saved to wishlist';
    }
  }

  stars(rating: number): ('filled' | 'empty')[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating) ? 'filled' : 'empty');
  }

  formatDate(iso: string): string {
    const date = new Date(iso);
    const now   = new Date();
    const days  = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
    if (days === 0)  return 'Today';
    if (days === 1)  return 'Yesterday';
    if (days < 7)   return `${days} days ago`;
    if (days < 30)  return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }
}
