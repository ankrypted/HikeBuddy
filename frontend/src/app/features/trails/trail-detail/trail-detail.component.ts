import {
  Component, Input, OnInit,
  ChangeDetectionStrategy, signal,
} from '@angular/core';
import { inject } from '@angular/core';
import { NavbarComponent }         from '../../../core/layout/navbar/navbar.component';
import { SceneBackgroundComponent } from '../../../shared/components/scene-background/scene-background.component';
import { TrailService }            from '../../../core/services/trail/trail.service';
import { TrailDetailDto, ReviewDto } from '../../../shared/models/trail.dto';

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

  readonly trail   = signal<TrailDetailDto | null>(null);
  readonly reviews = signal<ReviewDto[]>([]);
  readonly loading = signal(true);
  readonly error   = signal(false);

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
