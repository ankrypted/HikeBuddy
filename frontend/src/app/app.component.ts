import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet }            from '@angular/router';
import { CompletedTrailsService }  from './core/services/completed-trails/completed-trails.service';
import { TrailService }            from './core/services/trail/trail.service';
import { ReviewModalComponent, ReviewSubmission } from './shared/components/review-modal/review-modal.component';
import { TrailSummaryDto }         from './shared/models/trail.dto';

@Component({
  selector:        'app-root',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [RouterOutlet, ReviewModalComponent],
  template: `
    <router-outlet />
    @if (completedTrailsService.pendingReviewTrail(); as trail) {
      <hb-review-modal
        [trail]="trail"
        (submitted)="onReviewSubmitted(trail, $event)"
        (skipped)="completedTrailsService.clearPendingReview()"
      />
    }
  `,
  styles: [`:host { display: block; }`],
})
export class AppComponent {
  readonly completedTrailsService = inject(CompletedTrailsService);
  private readonly trailService   = inject(TrailService);

  onReviewSubmitted(trail: TrailSummaryDto, submission: ReviewSubmission): void {
    this.trailService.submitReview(trail.slug, {
      rating:               submission.rating,
      body:                 submission.comment,
      authorName:           '',
      authorAvatarInitials: '',
    }).subscribe();
    this.completedTrailsService.clearPendingReview();
  }
}
