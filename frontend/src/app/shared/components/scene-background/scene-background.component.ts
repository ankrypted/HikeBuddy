import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'hb-scene-background',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scene-background.component.html',
  styleUrl:    './scene-background.component.scss',
})
export class SceneBackgroundComponent {}
