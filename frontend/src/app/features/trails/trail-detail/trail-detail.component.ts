import {
  Component, Input, OnInit,
  ChangeDetectionStrategy, signal, computed, inject,
} from '@angular/core';
import { NavbarComponent }           from '../../../core/layout/navbar/navbar.component';
import { SceneBackgroundComponent }  from '../../../shared/components/scene-background/scene-background.component';
import { TrailService }              from '../../../core/services/trail/trail.service';
import { AuthService }               from '../../../core/services/auth/auth.service';
import { FavoritesService }          from '../../../core/services/favorites/favorites.service';
import { TrailDetailDto, ReviewDto } from '../../../shared/models/trail.dto';
import { INSIDE_SHELL }              from '../../../shared/tokens/shell.token';

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

  private readonly trailService = inject(TrailService);
  private readonly authService  = inject(AuthService);
  private readonly favService   = inject(FavoritesService);

  readonly insideShell = inject(INSIDE_SHELL);

  readonly trail   = signal<TrailDetailDto | null>(null);
  readonly reviews = signal<ReviewDto[]>([]);
  readonly loading = signal(true);
  readonly error   = signal(false);

  readonly isLoggedIn  = this.authService.isLoggedIn;
  readonly currentUser = this.authService.currentUser;
  readonly isSaved     = computed(() =>
    this.trail() ? this.favService.isFavorited(this.trail()!.id) : false,
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
  ngOnInit(): void {
    this.trailService.getTrailBySlug(this.slug).subscribe({
      next:  t  => { this.trail.set(t ?? null); this.loading.set(false); },
      error: () => { this.error.set(true);       this.loading.set(false); },
    });

    this.trailService.getTrailReviews(this.slug).subscribe({
      next: r => this.reviews.set(r),
    });
  }

  // ── Favorites ───────────────────────────────────────────────────────
  toggleFavorite(): void {
    const t = this.trail();
    if (!t) return;
    this.favService.toggleFavorite(t);
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
