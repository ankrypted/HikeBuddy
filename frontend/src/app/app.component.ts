import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { HttpErrorResponse }       from '@angular/common/http';
import { RouterOutlet }            from '@angular/router';
import { CompletedTrailsService }  from './core/services/completed-trails/completed-trails.service';
import { TrailService }            from './core/services/trail/trail.service';
import { ToastService }            from './core/services/toast/toast.service';
import { ReviewModalComponent, ReviewSubmission } from './shared/components/review-modal/review-modal.component';
import { ToastComponent }          from './shared/components/toast/toast.component';
import { ChatWidgetComponent }        from './shared/components/chat-widget/chat-widget.component';
import { MobileBottomNavComponent }  from './shared/components/mobile-bottom-nav/mobile-bottom-nav.component';
import { NotificationService }     from './core/services/notification/notification.service';
import { MessageService }          from './core/services/message/message.service';
import { AuthService }             from './core/services/auth/auth.service';
import { TrailSummaryDto }         from './shared/models/trail.dto';

@Component({
  selector:        'app-root',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [RouterOutlet, ReviewModalComponent, ToastComponent, ChatWidgetComponent, MobileBottomNavComponent],
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
    <hb-toast />
    @if (authService.isLoggedIn()) {
      <hb-chat-widget />
      <hb-mobile-bottom-nav />
    }
  `,
  styles: [`:host { display: block; }`],
})
export class AppComponent {
  readonly completedTrailsService  = inject(CompletedTrailsService);
  private readonly trailService    = inject(TrailService);
  private readonly toastService    = inject(ToastService);
  private readonly notifService    = inject(NotificationService);
  private readonly messageService  = inject(MessageService);
  protected readonly authService   = inject(AuthService);

  private readonly _reviewError = signal<string | null>(null);
  readonly reviewError = this._reviewError.asReadonly();

  constructor() {
    // Load notifications whenever login state changes; poll while logged in
    effect(() => {
      if (this.authService.isLoggedIn()) {
        this.notifService.load();
        this.notifService.startPolling();
        this.messageService.loadConversations();
        this.messageService.startPolling();
      } else {
        this.notifService.stopPolling();
        this.messageService.stopPolling();
      }
    });
  }

  onReviewSubmitted(trail: TrailSummaryDto, submission: ReviewSubmission): void {
    this._reviewError.set(null);
    this.trailService.submitReview(trail.slug, {
      rating:               submission.rating,
      body:                 submission.comment,
      authorName:           '',
      authorAvatarInitials: '',
      trailName:            trail.name,
    }).subscribe({
      next: () => this.completedTrailsService.clearPendingReview(),
      error: (err: HttpErrorResponse) => {
        const msg = err.status === 409
          ? "You've already reviewed this trail."
          : err.status === 422
          ? (err.error?.message ?? 'Your review could not be posted. Please revise your content and try again.')
          : 'Something went wrong. Please try again.';
        this._reviewError.set(msg);
        this.toastService.show(msg, 'error');
      },
    });
  }

  onSkip(): void {
    this._reviewError.set(null);
    this.completedTrailsService.clearPendingReview();
  }
}
