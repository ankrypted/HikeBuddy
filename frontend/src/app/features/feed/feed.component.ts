import {
  Component, OnInit, signal, inject, ChangeDetectionStrategy, computed,
} from '@angular/core';
import { RouterLink }                from '@angular/router';
import { NavbarComponent }           from '../../core/layout/navbar/navbar.component';
import { SceneBackgroundComponent }  from '../../shared/components/scene-background/scene-background.component';
import { ChatWidgetComponent }       from '../../shared/components/chat-widget/chat-widget.component';
import { UserService }               from '../../core/services/user/user.service';
import { TrailService }              from '../../core/services/trail/trail.service';
import { FavoritesService }          from '../../core/services/favorites/favorites.service';
import { CompletedTrailsService }    from '../../core/services/completed-trails/completed-trails.service';
import { ActivityEvent, PublicUserDto } from '../../shared/models/public-user.dto';
import { TrailSummaryDto }           from '../../shared/models/trail.dto';

export interface FeedEvent extends ActivityEvent {
  username:  string;
  avatarUrl: string | null;
}

export interface Achievement {
  id:          string;
  label:       string;
  description: string;
  svgPath:     string;
  unlocked:    boolean;
  current:     number;
  target:      number;
}

@Component({
  selector:        'hb-feed',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [NavbarComponent, SceneBackgroundComponent, RouterLink, ChatWidgetComponent],
  templateUrl:     './feed.component.html',
  styleUrl:        './feed.component.scss',
})
export class FeedComponent implements OnInit {
  private readonly userService      = inject(UserService);
  private readonly trailService     = inject(TrailService);
  private readonly favoritesService = inject(FavoritesService);
  private readonly completedService = inject(CompletedTrailsService);

  readonly feedItems       = signal<FeedEvent[]>([]);
  readonly loading         = signal(true);
  readonly suggestedTrails = signal<TrailSummaryDto[]>([]);
  readonly suggestedHikers = signal<PublicUserDto[]>([]);

  readonly completedCount  = this.completedService.count;
  readonly savedCount      = this.favoritesService.count;
  readonly followingCount  = computed(() => this.suggestedHikers().length);

  readonly achievements = computed<Achievement[]>(() => {
    const done  = this.completedCount();
    const saved = this.savedCount();
    return [
      {
        id: 'first-steps', label: 'First Steps', description: 'Complete your first trail',
        svgPath:  'M2 20h20M12 4L4 20h16L12 4',
        unlocked: done >= 1,  current: Math.min(done, 1),   target: 1,
      },
      {
        id: 'trail-blazer', label: 'Trail Blazer', description: 'Complete 5 trails',
        svgPath:  'M2 20h20M1 20L8 8l4 6 3-4 6 10',
        unlocked: done >= 5,  current: Math.min(done, 5),   target: 5,
      },
      {
        id: 'peak-pursuer', label: 'Peak Pursuer', description: 'Complete 10 trails',
        svgPath:  'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
        unlocked: done >= 10, current: Math.min(done, 10),  target: 10,
      },
      {
        id: 'summit-seeker', label: 'Summit Seeker', description: 'Complete 25 trails',
        svgPath:  'M8 21h8M12 21v-6M6 3h12l1 6H5L6 3zM5 9a7 7 0 0 0 14 0',
        unlocked: done >= 25, current: Math.min(done, 25),  target: 25,
      },
      {
        id: 'wishlist-novice', label: 'Wishlist Novice', description: 'Save your first trail',
        svgPath:  'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
        unlocked: saved >= 1, current: Math.min(saved, 1),  target: 1,
      },
      {
        id: 'trail-collector', label: 'Trail Collector', description: 'Save 10 trails',
        svgPath:  'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
        unlocked: saved >= 10, current: Math.min(saved, 10), target: 10,
      },
    ];
  });

  ngOnInit(): void {
    this.userService.getPublicProfiles().subscribe(profiles => {
      const items: FeedEvent[] = profiles.flatMap(p =>
        (p.recentActivity ?? []).map(e => ({
          ...e,
          username:  p.username,
          avatarUrl: p.avatarUrl,
        })),
      );
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      this.feedItems.set(items);
      this.loading.set(false);
      this.suggestedHikers.set(profiles.slice(0, 3));
    });

    this.trailService.getAllTrails().subscribe(trails => {
      const top = trails
        .filter(t => t.isFeatured)
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 4);
      this.suggestedTrails.set(top);
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
