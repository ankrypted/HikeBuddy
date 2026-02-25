import {
  Component, OnInit, ChangeDetectionStrategy, signal, computed, inject,
} from '@angular/core';
import { Router }                from '@angular/router';
import { NavbarComponent }       from '../../../core/layout/navbar/navbar.component';
import { SceneBackgroundComponent } from '../../../shared/components/scene-background/scene-background.component';
import { TrailFiltersComponent, TrailFilterState } from '../../../shared/components/trail-filters/trail-filters.component';
import { TrailService }          from '../../../core/services/trail/trail.service';
import { AuthService }           from '../../../core/services/auth/auth.service';
import { FavoritesService }      from '../../../core/services/favorites/favorites.service';
import { TrailSummaryDto }       from '../../../shared/models/trail.dto';
import { INSIDE_SHELL }          from '../../../shared/tokens/shell.token';

@Component({
  selector: 'hb-trails-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NavbarComponent, SceneBackgroundComponent, TrailFiltersComponent],
  templateUrl: './trails-list.component.html',
  styleUrl:    './trails-list.component.scss',
  host: { '[class.in-shell]': 'insideShell' },
})
export class TrailsListComponent implements OnInit {
  private readonly trailService = inject(TrailService);
  private readonly router       = inject(Router);
  private readonly authService  = inject(AuthService);
  private readonly favService   = inject(FavoritesService);

  readonly insideShell = inject(INSIDE_SHELL);

  readonly trails     = signal<TrailSummaryDto[]>([]);
  readonly loading    = signal(true);
  readonly error      = signal(false);
  readonly isLoggedIn = this.authService.isLoggedIn;

  // ── Filters ────────────────────────────────────────────────────────────
  readonly filterState = signal<TrailFilterState>({
    search: '', difficulty: '', region: '', sort: 'rating',
  });

  readonly regions = computed(() =>
    [...new Set(this.trails().map(t => t.region.name))].sort(),
  );

  readonly filteredTrails = computed(() => {
    const { search, difficulty, region, sort } = this.filterState();
    let list = this.trails();

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.region.name.toLowerCase().includes(q),
      );
    }
    if (difficulty) list = list.filter(t => t.difficulty === difficulty);
    if (region)     list = list.filter(t => t.region.name === region);

    const sorted = [...list];
    switch (sort) {
      case 'rating':    sorted.sort((a, b) => b.averageRating   - a.averageRating);   break;
      case 'dist-asc':  sorted.sort((a, b) => a.distanceKm      - b.distanceKm);      break;
      case 'dist-desc': sorted.sort((a, b) => b.distanceKm      - a.distanceKm);      break;
      case 'dur-asc':   sorted.sort((a, b) => a.durationMinutes - b.durationMinutes); break;
    }
    return sorted;
  });

  ngOnInit(): void {
    this.trailService.getAllTrails().subscribe({
      next:  t  => { this.trails.set(t); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }

  onFiltersChange(state: TrailFilterState): void {
    this.filterState.set(state);
  }

  navigate(trail: TrailSummaryDto): void {
    const base = this.insideShell ? '/dashboard/trails' : '/trails';
    this.router.navigate([base, trail.slug]);
  }

  isSaved(trailId: string): boolean {
    return this.favService.isFavorited(trailId);
  }

  toggleFavorite(trail: TrailSummaryDto, event: Event): void {
    event.stopPropagation();
    this.favService.toggleFavorite(trail);
  }

  formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }

  stars(rating: number): ('filled' | 'empty')[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating) ? 'filled' : 'empty');
  }
}
