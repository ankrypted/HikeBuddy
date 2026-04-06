import {
  Component, OnInit, signal, inject, ChangeDetectionStrategy, computed, effect,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TitleCasePipe }            from '@angular/common';
import { NavbarComponent }           from '../../core/layout/navbar/navbar.component';
import { SceneBackgroundComponent }  from '../../shared/components/scene-background/scene-background.component';
import { AuthService }               from '../../core/services/auth/auth.service';
import { UserService }               from '../../core/services/user/user.service';
import { TrailService }              from '../../core/services/trail/trail.service';
import { FavoritesService }          from '../../core/services/favorites/favorites.service';
import { CompletedTrailsService }    from '../../core/services/completed-trails/completed-trails.service';
import { FeedInteractionService }    from '../../core/services/feed-interaction/feed-interaction.service';
import { HikePostService } from '../../core/services/hike-post/hike-post.service';
import { combineLatest }              from 'rxjs';
import { ActivityEvent, PublicUserDto } from '../../shared/models/public-user.dto';
import { TrailSummaryDto }           from '../../shared/models/trail.dto';
import { InteractionSummaryDto }     from '../../shared/models/feed-interaction.dto';

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
  imports:         [NavbarComponent, SceneBackgroundComponent, RouterLink, TitleCasePipe],
  templateUrl:     './feed.component.html',
  styleUrl:        './feed.component.scss',
})
export class FeedComponent implements OnInit {
  private readonly authService         = inject(AuthService);
  readonly currentUser                 = this.authService.currentUser;
  private readonly userService         = inject(UserService);
  private readonly trailService        = inject(TrailService);
  private readonly favoritesService    = inject(FavoritesService);
  private readonly completedService    = inject(CompletedTrailsService);
  private readonly interactionService  = inject(FeedInteractionService);
  private readonly hikePostService     = inject(HikePostService);

  readonly posts       = this.hikePostService.posts;

  readonly feedItems          = signal<FeedEvent[]>([]);
  readonly loading            = signal(true);
  readonly suggestedTrails    = signal<TrailSummaryDto[]>([]);
  private readonly allUsers   = signal<PublicUserDto[]>([]);
  readonly subscribersCount   = signal<number>(0);

  // -- Interaction state (backed by database) ---
  readonly interactionMap = signal<Map<string, InteractionSummaryDto>>(new Map());
  readonly openComments   = signal<ReadonlySet<string>>(new Set());
  readonly drafts         = signal<ReadonlyMap<string, string>>(new Map());
  readonly copiedId        = signal<string | null>(null);
  readonly failedAvatars   = signal<ReadonlySet<string>>(new Set());

  readonly completedCount  = this.completedService.count;
  readonly savedCount      = this.favoritesService.count;
  readonly followingCount  = computed(() => this.userService.subscriptions().size);

  readonly suggestedHikers = computed(() => {
    const subs = this.userService.subscriptions();
    const me   = this.authService.currentUser()?.username;
    return this.allUsers().filter(p => !subs.has(p.username) && p.username !== me).slice(0, 3);
  });

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

  constructor() {
    // Re-fetch feed whenever the subscriptions set changes
    effect(() => {
      this.userService.subscriptions();
      this.loadFeed();
    });
  }


  ngOnInit(): void {
    this.hikePostService.loadFeed();
    const username = this.authService.currentUser()?.username;
    if (username) {
      this.userService.getPublicProfile(username).subscribe(p => this.subscribersCount.set(p.subscribersCount));
    }
    this.userService.getPublicProfiles().subscribe(all => this.allUsers.set(all));
    this.trailService.getAllTrails().subscribe(trails => {
      const top = trails
        .filter(t => t.isFeatured)
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 4);
      this.suggestedTrails.set(top);
    });
  }

  private loadFeed(): void {
    this.loading.set(true);
    combineLatest([
      this.userService.getFeedProfiles(),
      this.trailService.getAllTrails(),
    ]).subscribe(([profiles, trails]) => {
      const trailMap = new Map<string, TrailSummaryDto>();
      for (const t of trails) { trailMap.set(t.id, t); trailMap.set(t.slug, t); }
      const items: FeedEvent[] = profiles.flatMap(p =>
        (p.recentActivity ?? []).map(e => {
          const trail = e.trailId ? trailMap.get(e.trailId) : undefined;
          return {
            ...e,
            trailName:  trail?.name           ?? e.trailName,
            trailSlug:  trail?.slug           ?? e.trailSlug,
            difficulty: trail?.difficulty     ?? e.difficulty,
            regionName: trail?.region?.name   ?? e.regionName,
            username:   p.username,
            avatarUrl:  p.avatarUrl,
          };
        }),
      );
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      this.feedItems.set(items);
      this.loading.set(false);

      // Fetch interaction summaries for all feed items in one call
      if (items.length) {
        const refs = items.map(i => ({ ownerUsername: i.username, eventId: i.id }));
        this.interactionService.batchSummaries(refs).subscribe(map => {
          this.interactionMap.set(new Map(Object.entries(map)));
        });
      }
    });
  }

  // ── Interaction helpers ───────────────────────────────────────────────────

  key(item: FeedEvent): string {
    return `${item.username}:${item.id}`;
  }

  summaryOf(item: FeedEvent): InteractionSummaryDto {
    return this.interactionMap().get(this.key(item))
        ?? { likeCount: 0, likedByMe: false, comments: [] };
  }

  // ── Interaction handlers ──────────────────────────────────────────────────

  toggleLike(item: FeedEvent): void {
    this.interactionService
      .toggleLike(item.username, item.id, item.trailName ?? '', item.type)
      .subscribe(summary => {
        this.interactionMap.update(m => new Map(m).set(this.key(item), summary));
      });
  }

  toggleComments(id: string): void {
    this.openComments.update(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  updateDraft(id: string, text: string): void {
    this.drafts.update(m => new Map([...m, [id, text]]));
  }

  postComment(item: FeedEvent): void {
    const text = this.drafts().get(item.id)?.trim();
    if (!text) return;

    this.interactionService
      .postComment(item.username, item.id, text, item.trailName ?? '', item.type)
      .subscribe(comment => {
        this.interactionMap.update(m => {
          const current = m.get(this.key(item)) ?? { likeCount: 0, likedByMe: false, comments: [] };
          return new Map(m).set(this.key(item), {
            ...current,
            comments: [...current.comments, comment],
          });
        });
        this.drafts.update(m => new Map([...m, [item.id, '']]));
        if (!this.openComments().has(item.id)) {
          this.openComments.update(s => new Set([...s, item.id]));
        }
      });
  }

  copyLink(itemId: string, slug: string | undefined): void {
    if (!slug) return;
    navigator.clipboard.writeText(window.location.origin + '/trails/' + slug);
    this.copiedId.set(itemId);
    setTimeout(() => this.copiedId.set(null), 2000);
  }

  onAvatarError(username: string): void {
    this.failedAvatars.update(s => new Set([...s, username]));
  }

  deletePost(id: string): void { this.hikePostService.delete(id).subscribe(); }

  // ── Helpers ──────────────────────────────────────────────────────────────
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
