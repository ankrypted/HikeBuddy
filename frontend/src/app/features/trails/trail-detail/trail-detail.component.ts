import {
  Component, Input, OnInit,
  ChangeDetectionStrategy, signal, computed, inject,
} from '@angular/core';
import { Router }                    from '@angular/router';
import { NavbarComponent }           from '../../../core/layout/navbar/navbar.component';
import { SceneBackgroundComponent }  from '../../../shared/components/scene-background/scene-background.component';
import { TrailService }              from '../../../core/services/trail/trail.service';
import { AuthService }               from '../../../core/services/auth/auth.service';
import { FavoritesService }          from '../../../core/services/favorites/favorites.service';
import { CompletedTrailsService }    from '../../../core/services/completed-trails/completed-trails.service';
import { TrailDetailDto, TrailSummaryDto, ReviewDto } from '../../../shared/models/trail.dto';
import { INSIDE_SHELL }              from '../../../shared/tokens/shell.token';
import { GeolocationService }        from '../../../core/services/geolocation/geolocation.service';

@Component({
  selector:         'hb-trail-detail',
  standalone:       true,
  changeDetection:  ChangeDetectionStrategy.OnPush,
  imports:          [NavbarComponent, SceneBackgroundComponent],
  templateUrl:      './trail-detail.component.html',
  styleUrl:         './trail-detail.component.scss',
})
export class TrailDetailComponent implements OnInit {
  @Input() slug = '';   // auto-bound by withComponentInputBinding()

  private readonly trailService      = inject(TrailService);
  private readonly authService       = inject(AuthService);
  private readonly favService        = inject(FavoritesService);
  private readonly completedService  = inject(CompletedTrailsService);
  private readonly router            = inject(Router);
  private readonly geoService        = inject(GeolocationService);

  readonly insideShell = inject(INSIDE_SHELL);

  readonly trail           = signal<TrailDetailDto | null>(null);
  readonly reviews         = signal<ReviewDto[]>([]);
  readonly recommendations = signal<TrailSummaryDto[]>([]);
  readonly loading         = signal(true);
  readonly error           = signal(false);
  readonly userCoords      = signal<{ lat: number; lon: number } | null>(null);

  readonly distanceFromUser = computed(() => {
    const t = this.trail();
    const u = this.userCoords();
    if (!t || !u) return null;
    return Math.round(this.geoService.haversineKm(u.lat, u.lon, t.startLatitude, t.startLongitude));
  });

  readonly isLoggedIn   = this.authService.isLoggedIn;
  readonly currentUser  = this.authService.currentUser;
  readonly isSaved      = computed(() =>
    this.trail() ? this.favService.isFavorited(this.trail()!.id) : false,
  );
  readonly isCompleted  = computed(() =>
    this.trail() ? this.completedService.isCompleted(this.trail()!.id) : false,
  );

  // ── Review form state ───────────────────────────────────────────────
  readonly reviewRating = signal(0);
  readonly hoverRating  = signal(0);
  readonly reviewBody   = signal('');
  readonly submitting   = signal(false);
  readonly submitted    = signal(false);

  readonly ratingLabel = computed(() => {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
    return labels[this.reviewRating()] ?? '';
  });

  readonly starOptions = [1, 2, 3, 4, 5];

  // ── Lifecycle ───────────────────────────────────────────────────────
  navigateToTrail(trail: TrailSummaryDto): void {
    const base = this.insideShell ? '/dashboard/trails' : '/trails';
    this.router.navigate([base, trail.slug]);
  }

  ngOnInit(): void {
    this.trailService.getTrailBySlug(this.slug).subscribe({
      next: t => {
        this.trail.set(t ?? null);
        this.loading.set(false);
        if (t) {
          this.trailService.getSimilarTrails(t).subscribe({
            next: recs => this.recommendations.set(recs),
          });
        }
      },
      error: () => { this.error.set(true); this.loading.set(false); },
    });

    this.trailService.getTrailReviews(this.slug).subscribe({
      next: r => this.reviews.set(r),
    });

    this.geoService.getUserPosition().subscribe({
      next: coords => this.userCoords.set(coords),
      // silently ignore: user denied permission, unsupported, timeout
    });
  }

  // ── Favorites ───────────────────────────────────────────────────────
  toggleFavorite(): void {
    const t = this.trail();
    if (!t) return;
    this.favService.toggleFavorite(t);
  }

  // ── Completed ───────────────────────────────────────────────────────
  toggleComplete(): void {
    const t = this.trail();
    if (!t) return;
    if (this.isCompleted()) {
      this.completedService.unmarkComplete(t.id);
    } else {
      this.completedService.markComplete(t);
    }
  }

  // ── Review form ─────────────────────────────────────────────────────
  setRating(n: number): void { this.reviewRating.set(n); }
  setHover(n: number): void  { this.hoverRating.set(n); }
  clearHover(): void         { this.hoverRating.set(0); }

  onBodyInput(event: Event): void {
    this.reviewBody.set((event.target as HTMLTextAreaElement).value);
  }

  submitReview(): void {
    const rating = this.reviewRating();
    const body   = this.reviewBody().trim();
    const user   = this.currentUser();
    if (rating === 0 || !body || !user || this.submitting()) return;

    const initials = user.username
      .split(/\s+/)
      .map((w: string) => w[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('') || user.username.slice(0, 2).toUpperCase();

    this.submitting.set(true);
    this.trailService
      .submitReview(this.slug, {
        rating,
        body,
        authorName:           user.username,
        authorAvatarInitials: initials,
      })
      .subscribe({
        next: review => {
          this.reviews.update(rs => [review, ...rs]);
          this.reviewRating.set(0);
          this.reviewBody.set('');
          this.submitted.set(true);
          this.submitting.set(false);
          setTimeout(() => this.submitted.set(false), 3500);
        },
        error: () => this.submitting.set(false),
      });
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  stars(rating: number): ('filled' | 'empty')[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating) ? 'filled' : 'empty');
  }

  formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
}
