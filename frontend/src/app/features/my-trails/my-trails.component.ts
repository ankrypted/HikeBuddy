import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink }           from '@angular/router';
import { CompletedTrailsService }       from '../../core/services/completed-trails/completed-trails.service';
import { TrailSummaryDto }              from '../../shared/models/trail.dto';
import { TrailFiltersComponent, TrailFilterState } from '../../shared/components/trail-filters/trail-filters.component';

@Component({
  selector: 'hb-my-trails',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TrailFiltersComponent],
  templateUrl: './my-trails.component.html',
  styleUrl:    './my-trails.component.scss',
})
export class MyTrailsComponent {
  private readonly router              = inject(Router);
  readonly completedService            = inject(CompletedTrailsService);

  // ── Filters ──────────────────────────────────────────────────────────────
  readonly filterState = signal<TrailFilterState>({
    search: '', difficulty: '', region: '', sort: 'rating',
  });

  readonly regions = computed(() =>
    [...new Set(this.completedService.completedTrails().map(t => t.region.name))].sort(),
  );

  readonly filteredTrails = computed(() => {
    const { search, difficulty, region, sort } = this.filterState();
    let list = this.completedService.completedTrails();

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

  onFiltersChange(state: TrailFilterState): void {
    this.filterState.set(state);
  }

  navigate(trail: TrailSummaryDto): void {
    this.router.navigate(['/dashboard/trails', trail.slug]);
  }

  unmark(trail: TrailSummaryDto, event: Event): void {
    event.stopPropagation();
    this.completedService.unmarkComplete(trail.id);
  }

  formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
}
