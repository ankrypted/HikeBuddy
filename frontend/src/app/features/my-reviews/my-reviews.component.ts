import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink }    from '@angular/router';
import { TrailService }  from '../../core/services/trail/trail.service';
import { UserReviewDto } from '../../shared/models/trail.dto';

@Component({
  selector:        'hb-my-reviews',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [RouterLink],
  templateUrl:     './my-reviews.component.html',
  styleUrl:        './my-reviews.component.scss',
})
export class MyReviewsComponent implements OnInit {
  private readonly trailService = inject(TrailService);

  readonly reviews = signal<UserReviewDto[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.trailService.getMyReviews().subscribe({
      next:  r  => { this.reviews.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  stars(rating: number): ('filled' | 'empty')[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating) ? 'filled' : 'empty');
  }
}
