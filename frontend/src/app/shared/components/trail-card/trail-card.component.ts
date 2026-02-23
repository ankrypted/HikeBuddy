import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy,
} from '@angular/core';
import { NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { TrailSummaryDto } from '../../models/trail.dto';

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

  onCardClick(): void {
    this.viewTrail.emit(this.trail);
  }
}
