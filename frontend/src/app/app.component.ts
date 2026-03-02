import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { HttpErrorResponse }       from '@angular/common/http';
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
        [error]="reviewError()"
        (submitted)="onReviewSubmitted(trail, $event)"
        (skipped)="onSkip()"
      />
    }
  `,
  styles: [`:host { display: block; }`],
})
export class AppComponent {
  readonly completedTrailsService = inject(CompletedTrailsService);
  private readonly trailService   = inject(TrailService);

  private readonly _reviewError = signal<string | null>(null);
  readonly reviewError = this._reviewError.asReadonly();

  onReviewSubmitted(trail: TrailSummaryDto, submission: ReviewSubmission): void {
    this._reviewError.set(null);
    this.trailService.submitReview(trail.slug, {
      rating:               submission.rating,
      body:                 submission.comment,
      authorName:           '',
      authorAvatarInitials: '',
    }).subscribe({
      next:  () => this.completedTrailsService.clearPendingReview(),
      error: (err: HttpErrorResponse) => {
        this._reviewError.set(
          err.status === 409
            ? "You've already reviewed this trail."
            : 'Something went wrong. Please try again.'
        );
      },
    });
  }

  onSkip(): void {
    this._reviewError.set(null);
    this.completedTrailsService.clearPendingReview();
  }
}
