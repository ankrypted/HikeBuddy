import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink }                         from '@angular/router';
import { NavbarComponent }                    from '../../../core/layout/navbar/navbar.component';
import { SceneBackgroundComponent }           from '../../../shared/components/scene-background/scene-background.component';

@Component({
  selector: 'hb-verify-email-sent',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NavbarComponent, SceneBackgroundComponent],
  templateUrl: './verify-email-sent.component.html',
  styleUrl:    './verify-email-sent.component.scss',
})
export class VerifyEmailSentComponent {}
