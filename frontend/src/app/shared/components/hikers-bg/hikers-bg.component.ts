import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'hb-hikers-bg',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hikers-bg.component.html',
  styleUrl:    './hikers-bg.component.scss',
})
export class HikersBgComponent {}
