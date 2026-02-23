import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink }                                  from '@angular/router';
import { MatIconModule }                               from '@angular/material/icon';

@Component({
  selector: 'hb-cta-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule],
  templateUrl: './cta-card.component.html',
  styleUrl:    './cta-card.component.scss',
})
export class CtaCardComponent {
  @Input({ required: true }) title!:    string;
  @Input({ required: true }) subtitle!: string;
  @Input({ required: true }) linkTarget!: string;
}
