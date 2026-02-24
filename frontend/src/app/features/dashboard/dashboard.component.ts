import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink }               from '@angular/router';
import { NavbarComponent }          from '../../core/layout/navbar/navbar.component';
import { AuthService }              from '../../core/services/auth/auth.service';

@Component({
  selector: 'hb-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NavbarComponent, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl:    './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
}
