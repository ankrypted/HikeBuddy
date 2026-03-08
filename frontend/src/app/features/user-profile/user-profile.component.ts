import {
  Component, Input, OnInit,
  ChangeDetectionStrategy, signal, computed, inject,
} from '@angular/core';
import { toSignal }               from '@angular/core/rxjs-interop';
import { RouterLink }              from '@angular/router';
import { NavbarComponent }         from '../../core/layout/navbar/navbar.component';
import { SceneBackgroundComponent } from '../../shared/components/scene-background/scene-background.component';
import { UserService }             from '../../core/services/user/user.service';
import { TrailService }            from '../../core/services/trail/trail.service';
import { AuthService }             from '../../core/services/auth/auth.service';
import { MessageService }          from '../../core/services/message/message.service';
import { PublicUserDto, ActivityEvent, PublicTrailRef } from '../../shared/models/public-user.dto';
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

  private readonly userService  = inject(UserService);
  private readonly trailService = inject(TrailService);
  private readonly authService  = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly document     = inject(DOCUMENT);

  private readonly allTrails = toSignal(this.trailService.getAllTrails(), { initialValue: [] });

  readonly profile     = signal<PublicUserDto | null>(null);
  readonly loading     = signal(true);
  readonly notFound    = signal(false);
  readonly avatarError = signal(false);
  readonly subscribed = computed(() => this.userService.isSubscribed(this.username));
  readonly copied     = signal(false);

  readonly currentUser  = this.authService.currentUser;
  readonly isOwnProfile = computed(() =>
    !!this.currentUser() && this.currentUser()!.username === this.profile()?.username,
  );

  /** Activity events with trail metadata resolved from TrailService. */
  readonly resolvedActivity = computed<ActivityEvent[]>(() => {
    const p = this.profile();
    if (!p?.recentActivity?.length) return [];
    // If already fully resolved (mock profiles have trailName populated), return as-is
    if (p.recentActivity[0].trailName) return p.recentActivity;
    // Backend events have trailId only — resolve metadata from allTrails
    const trails = this.allTrails();
    return p.recentActivity.map(e => {
      const trail = trails.find(t => t.id === e.trailId);
      return {
        ...e,
        trailName:  trail?.name         ?? e.trailId ?? '',
        trailSlug:  trail?.slug         ?? e.trailId ?? '',
        difficulty: trail?.difficulty   ?? 'MODERATE',
        regionName: trail?.region?.name ?? '',
      };
    });
  });

  /** Resolved trail details — prefers backend IDs, falls back to embedded mock refs. */
  readonly completedTrails = computed<PublicTrailRef[]>(() => {
    const p = this.profile();
    if (!p) return [];
    // Mock profiles (fallback) already have completedTrails populated
    if (p.completedTrails?.length) return p.completedTrails;
    // Real profiles from backend: resolve IDs against TrailService data
    const ids = p.completedTrailIds ?? [];
    if (!ids.length) return [];
    const trails = this.allTrails();
    return ids
      .map(id => trails.find(t => t.id === id))
      .filter((t): t is NonNullable<typeof t> => !!t)
      .map(t => ({
        id:            t.id,
        name:          t.name,
        slug:          t.slug,
        difficulty:    t.difficulty,
        regionName:    t.region.name,
        averageRating: t.averageRating,
      }));
  });

  ngOnInit(): void {
    this.userService.getPublicProfile(this.username).subscribe({
      next:  p  => { this.profile.set(p); this.loading.set(false); },
      error: () => { this.notFound.set(true); this.loading.set(false); },
    });
  }

  openChatWith(username: string): void {
    this.messageService.openChatWith(username);
  }

  toggleSubscribe(): void {
    this.userService.toggleSubscription(this.username);
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
