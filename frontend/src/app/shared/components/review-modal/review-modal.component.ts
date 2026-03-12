import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, signal, computed, input, effect,
} from '@angular/core';
import { TrailSummaryDto } from '../../models/trail.dto';

export interface ReviewSubmission {
  rating:  number;
  comment: string;
}

@Component({
  selector:        'hb-review-modal',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:     './review-modal.component.html',
  styleUrl:        './review-modal.component.scss',
})
export class ReviewModalComponent {
  @Input({ required: true }) trail!: TrailSummaryDto;

  /** Error message from parent (e.g. "already reviewed"). Resets submitting state. */
  readonly error = input<string | null>(null);

  @Output() submitted = new EventEmitter<ReviewSubmission>();
  @Output() skipped   = new EventEmitter<void>();

  readonly reviewRating = signal(0);
  readonly hoverRating  = signal(0);
  readonly reviewBody   = signal('');
  readonly submitting   = signal(false);

  constructor() {
    // When the parent sets an error, unlock the submit button so the user can retry.
    effect(() => { if (this.error()) this.submitting.set(false); });
  }

  readonly ratingLabel = computed(() => {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
    return labels[this.reviewRating()] ?? '';
  });

  readonly canSubmit = computed(() =>
    this.reviewRating() > 0 && this.reviewBody().trim().length > 0 && !this.submitting()
  );

  readonly starOptions = [1, 2, 3, 4, 5];

  setRating(n: number): void { this.reviewRating.set(n); }
  setHover(n: number): void  { this.hoverRating.set(n); }
  clearHover(): void         { this.hoverRating.set(0); }

  onBodyInput(event: Event): void {
    this.reviewBody.set((event.target as HTMLTextAreaElement).value);
  }

  onSubmit(): void {
    if (!this.canSubmit()) return;
    // Check content appropriation before setting the reviewBody and return with a warning if not appropriate.

    this.submitting.set(true);
    this.submitted.emit({ rating: this.reviewRating(), comment: this.reviewBody().trim() });
  }

  onSkip(): void {
    this.skipped.emit();
  }
}
