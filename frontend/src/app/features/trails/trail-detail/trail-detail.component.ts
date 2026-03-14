import {
  Component, Input, OnInit,
  ChangeDetectionStrategy, signal, computed, inject,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink }        from '@angular/router';
import { NavbarComponent }           from '../../../core/layout/navbar/navbar.component';
import { SceneBackgroundComponent }  from '../../../shared/components/scene-background/scene-background.component';
import { TrailService }              from '../../../core/services/trail/trail.service';
import { AuthService }               from '../../../core/services/auth/auth.service';
import { FavoritesService }          from '../../../core/services/favorites/favorites.service';
import { CompletedTrailsService }    from '../../../core/services/completed-trails/completed-trails.service';
import { FeedInteractionService }    from '../../../core/services/feed-interaction/feed-interaction.service';
import { TrailDetailDto, TrailSummaryDto, ReviewDto } from '../../../shared/models/trail.dto';
import { InteractionSummaryDto }     from '../../../shared/models/feed-interaction.dto';
import { INSIDE_SHELL }              from '../../../shared/tokens/shell.token';
import { GeolocationService }        from '../../../core/services/geolocation/geolocation.service';

@Component({
  selector:         'hb-trail-detail',
  standalone:       true,
  changeDetection:  ChangeDetectionStrategy.OnPush,
  imports:          [NavbarComponent, SceneBackgroundComponent, RouterLink],
  templateUrl:      './trail-detail.component.html',
  styleUrl:         './trail-detail.component.scss',
})
export class TrailDetailComponent implements OnInit {
  @Input() slug = '';   // auto-bound by withComponentInputBinding()

  private readonly trailService        = inject(TrailService);
  private readonly authService         = inject(AuthService);
  private readonly favService          = inject(FavoritesService);
  private readonly completedService    = inject(CompletedTrailsService);
  private readonly interactionService  = inject(FeedInteractionService);
  private readonly router              = inject(Router);
  private readonly geoService          = inject(GeolocationService);

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

  readonly travelAdvice = computed(() => {
    const t = this.trail();
    if (!t) return [];
    const d    = this.distanceFromUser();
    const city = t.nearestCity;

    if (d !== null && d <= 150) {
      return [
        `You are only ${d} km away — drive or take a local bus directly to ${city}.`,
        `The trek starts from ${city}.`,
      ];
    }
    if (d !== null && d <= 700) {
      return [
        `Take a train or bus to ${t.nearestRailStation}.`,
        `From ${t.nearestRailStation}, hire a cab or shared jeep to ${city}.`,
        `The trek starts from ${city}.`,
      ];
    }
    // Far away or no location data → recommend flight
    const distNote = d !== null ? ` — most cost-effective from your location (${d} km away)` : '';
    return [
      `Fly to ${t.nearestAirport}${distNote}.`,
      `From the airport, hire a cab or take a bus to ${city}.`,
      `The trek starts from ${city}.`,
    ];
  });

  readonly isLoggedIn   = this.authService.isLoggedIn;
  readonly currentUser  = this.authService.currentUser;
  readonly isSaved      = computed(() =>
    this.trail() ? this.favService.isFavorited(this.trail()!.id) : false,
  );
  readonly isCompleted  = computed(() =>
    this.trail() ? this.completedService.isCompleted(this.trail()!.id) : false,
  );

  // ── Review interaction state ─────────────────────────────────────────
  readonly reviewInteractionMap = signal<Map<string, InteractionSummaryDto>>(new Map());
  readonly openReviewComments   = signal<ReadonlySet<string>>(new Set());
  readonly reviewDrafts         = signal<ReadonlyMap<string, string>>(new Map());
  readonly copiedReviewId       = signal<string | null>(null);

  reviewKey(review: ReviewDto): string {
    return `${review.authorName}:${review.id}`;
  }

  reviewSummary(review: ReviewDto): InteractionSummaryDto {
    return this.reviewInteractionMap().get(this.reviewKey(review))
        ?? { likeCount: 0, likedByMe: false, comments: [] };
  }

  toggleReviewLike(review: ReviewDto): void {
    const trailName = this.trail()?.name ?? '';
    this.interactionService
      .toggleLike(review.authorName, review.id, trailName, 'reviewed')
      .subscribe(summary => {
        this.reviewInteractionMap.update(m => new Map(m).set(this.reviewKey(review), summary));
      });
  }

  toggleReviewComments(id: string): void {
    this.openReviewComments.update(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  updateReviewDraft(id: string, text: string): void {
    this.reviewDrafts.update(m => new Map([...m, [id, text]]));
  }

  postReviewComment(review: ReviewDto): void {
    const text = this.reviewDrafts().get(review.id)?.trim();
    if (!text) return;
    const trailName = this.trail()?.name ?? '';
    this.interactionService
      .postComment(review.authorName, review.id, text, trailName, 'reviewed')
      .subscribe(comment => {
        this.reviewInteractionMap.update(m => {
          const cur = m.get(this.reviewKey(review)) ?? { likeCount: 0, likedByMe: false, comments: [] };
          return new Map(m).set(this.reviewKey(review), { ...cur, comments: [...cur.comments, comment] });
        });
        this.reviewDrafts.update(m => new Map([...m, [review.id, '']]));
        if (!this.openReviewComments().has(review.id)) {
          this.openReviewComments.update(s => new Set([...s, review.id]));
        }
      });
  }

  copyReviewLink(reviewId: string): void {
    navigator.clipboard.writeText(window.location.href);
    this.copiedReviewId.set(reviewId);
    setTimeout(() => this.copiedReviewId.set(null), 2000);
  }

  // ── Review form state ───────────────────────────────────────────────
  readonly reviewRating = signal(0);
  readonly hoverRating  = signal(0);
  readonly reviewBody   = signal('');
  readonly submitting   = signal(false);
  readonly submitted        = signal(false);
  readonly submitError      = signal<string | null>(null);
  readonly deletingReviewId = signal<string | null>(null);

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
      next: r => {
        this.reviews.set(r);
        if (r.length) {
          const refs = r.map(rv => ({ ownerUsername: rv.authorName, eventId: rv.id }));
          this.interactionService.batchSummaries(refs).subscribe(map => {
            this.reviewInteractionMap.set(new Map(Object.entries(map)));
          });
        }
      },
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
        trailName:            this.trail()?.name ?? this.slug,
      })
      .subscribe({
        next: review => {
          this.reviews.update(rs => [review, ...rs]);
          this.reviewRating.set(0);
          this.reviewBody.set('');
          this.submitted.set(true);
          this.submitError.set(null);
          this.submitting.set(false);
          setTimeout(() => this.submitted.set(false), 3500);
        },
        error: (err: HttpErrorResponse) => {
          this.submitting.set(false);
          const msg = err.status === 409
            ? "You've already reviewed this trail."
            : err.status === 422
            ? (err.error?.message ?? 'Your review could not be posted. Please revise your content and try again.')
            : 'Something went wrong. Please try again.';
          this.submitError.set(msg);
        },
      });
  }

  deleteReview(review: ReviewDto): void {
    if (this.deletingReviewId()) return;
    this.deletingReviewId.set(review.id);
    this.trailService.deleteReview(this.slug, review.id).subscribe({
      next: () => {
        this.reviews.update(rs => rs.filter(r => r.id !== review.id));
        this.deletingReviewId.set(null);
      },
      error: () => this.deletingReviewId.set(null),
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  initials(username: string): string {
    return username.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || '?';
  }

  formatInr(n: number): string {
    return '₹' + n.toLocaleString('en-IN');
  }

  stars(rating: number): ('filled' | 'empty')[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating) ? 'filled' : 'empty');
  }

  formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
}
