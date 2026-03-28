import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule }                        from '@angular/common';

@Component({
  selector:        'hb-rooms',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule],
  templateUrl:     './rooms.component.html',
  styleUrl:        './rooms.component.scss',
})
export class RoomsComponent {}
