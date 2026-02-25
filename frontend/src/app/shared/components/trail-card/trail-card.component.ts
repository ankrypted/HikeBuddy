import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject, computed,
} from '@angular/core';
import { NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { TrailSummaryDto }  from '../../models/trail.dto';
import { AuthService }      from '../../../core/services/auth/auth.service';
import { FavoritesService } from '../../../core/services/favorites/favorites.service';

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
  @Input() raised = false;  // true for the middle card (translateY offset)

  @Output() viewTrail = new EventEmitter<TrailSummaryDto>();

  private readonly authService = inject(AuthService);
  private readonly favService  = inject(FavoritesService);

  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly isSaved    = computed(() => this.favService.isFavorited(this.trail.id));

  onCardClick(): void {
    this.viewTrail.emit(this.trail);
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    this.favService.toggleFavorite(this.trail);
  }
}
