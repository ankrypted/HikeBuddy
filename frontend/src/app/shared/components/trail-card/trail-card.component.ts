import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject, computed,
} from '@angular/core';
import { NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { TrailSummaryDto }         from '../../models/trail.dto';
import { AuthService }             from '../../../core/services/auth/auth.service';
import { FavoritesService }        from '../../../core/services/favorites/favorites.service';
import { CompletedTrailsService }  from '../../../core/services/completed-trails/completed-trails.service';

@Component({
  selector: 'hb-trail-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgSwitch, NgSwitchCase, NgSwitchDefault],
  templateUrl: './trail-card.component.html',
  styleUrl:    './trail-card.component.scss',
})
export class TrailCardComponent {
  @Input({ required: true }) trail!: TrailSummaryDto;
  @Input() raised = false;

  @Output() viewTrail = new EventEmitter<TrailSummaryDto>();

  private readonly authService      = inject(AuthService);
  private readonly favService       = inject(FavoritesService);
  private readonly completedService = inject(CompletedTrailsService);

  readonly isLoggedIn  = this.authService.isLoggedIn;
  readonly isSaved     = computed(() => this.favService.isFavorited(this.trail.id));
  readonly isCompleted = computed(() => this.completedService.isCompleted(this.trail.id));

  onCardClick(): void {
    this.viewTrail.emit(this.trail);
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    this.favService.toggleFavorite(this.trail);
  }

  toggleComplete(event: Event): void {
    event.stopPropagation();
    if (this.isCompleted()) {
      this.completedService.unmarkComplete(this.trail.id);
    } else {
      this.completedService.markComplete(this.trail);
    }
  }
}
