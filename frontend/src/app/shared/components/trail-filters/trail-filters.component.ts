import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { DifficultyLevel } from '../../models/trail.dto';

export interface TrailFilterState {
  search:     string;
  difficulty: DifficultyLevel | '';
  region:     string;
  sort:       'rating' | 'dist-asc' | 'dist-desc' | 'dur-asc';
}

@Component({
  selector:         'hb-trail-filters',
  standalone:       true,
  changeDetection:  ChangeDetectionStrategy.OnPush,
  templateUrl:      './trail-filters.component.html',
  styleUrl:         './trail-filters.component.scss',
})
export class TrailFiltersComponent {
  readonly regions       = input<string[]>([]);
  readonly filtersChange = output<TrailFilterState>();

  readonly search     = signal('');
  readonly difficulty = signal<DifficultyLevel | ''>('');
  readonly region     = signal('');
  readonly sort       = signal<TrailFilterState['sort']>('rating');

  readonly difficulties: Array<DifficultyLevel | ''> = ['', 'EASY', 'MODERATE', 'HARD', 'EXPERT'];

  readonly diffLabel: Record<string, string> = {
    '': 'All', 'EASY': 'Easy', 'MODERATE': 'Moderate', 'HARD': 'Hard', 'EXPERT': 'Expert',
  };

  private emit(): void {
    this.filtersChange.emit({
      search:     this.search(),
      difficulty: this.difficulty(),
      region:     this.region(),
      sort:       this.sort(),
    });
  }

  setSearch(v: string):                      void { this.search.set(v);     this.emit(); }
  setDifficulty(d: DifficultyLevel | ''):    void { this.difficulty.set(d); this.emit(); }
  setRegion(r: string):                      void { this.region.set(r);     this.emit(); }
  setSort(s: TrailFilterState['sort']):      void { this.sort.set(s);       this.emit(); }
}
