import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink }                          from '@angular/router';

@Component({
  selector: 'hb-hiker-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './hiker-logo.component.html',
  styleUrl:    './hiker-logo.component.scss',
})
export class HikerLogoComponent {}
