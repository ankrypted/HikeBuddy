import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RouterLink }   from '@angular/router';
import { AuthService }  from '../../../core/services/auth/auth.service';

@Component({
  selector: 'hb-hiker-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './hiker-logo.component.html',
  styleUrl:    './hiker-logo.component.scss',
})
export class HikerLogoComponent {
  private readonly authService = inject(AuthService);
  readonly logoLink = computed(() => this.authService.isLoggedIn() ? '/feed' : '/');
}
