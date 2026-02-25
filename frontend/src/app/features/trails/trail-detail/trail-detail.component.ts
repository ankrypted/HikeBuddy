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

  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly isSaved    = computed(() =>
    this.trail() ? this.favService.isFavorited(this.trail()!.id) : false,
  );

  toggleFavorite(): void {
    const t = this.trail();
    if (!t) return;
    this.favService.toggleFavorite(t);
  }

  ngOnInit(): void {
    this.trailService.getTrailBySlug(this.slug).subscribe({
      next:  t  => { this.trail.set(t ?? null); this.loading.set(false); },
      error: () => { this.error.set(true);       this.loading.set(false); },
    });

    this.trailService.getTrailReviews(this.slug).subscribe({
      next: r => this.reviews.set(r),
    });
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
