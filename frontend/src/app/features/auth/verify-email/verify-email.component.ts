import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink }                                  from '@angular/router';
import { HttpClient }                                                  from '@angular/common/http';
import { NavbarComponent }                                             from '../../../core/layout/navbar/navbar.component';
import { SceneBackgroundComponent }                                    from '../../../shared/components/scene-background/scene-background.component';
import { environment }                                                 from '../../../../environments/environment';

type State = 'loading' | 'success' | 'error';

@Component({
  selector: 'hb-verify-email',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NavbarComponent, SceneBackgroundComponent],
  templateUrl: './verify-email.component.html',
  styleUrl:    './verify-email.component.scss',
})
export class VerifyEmailComponent implements OnInit {
  private readonly route  = inject(ActivatedRoute);
  private readonly http   = inject(HttpClient);

  readonly state   = signal<State>('loading');
  readonly message = signal<string>('');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.message.set('No verification token found in the URL.');
      this.state.set('error');
      return;
    }

    this.http
      .get<{ message: string }>(`${environment.apiUrl}/auth/verify-email`, { params: { token } })
      .subscribe({
        next: (res) => {
          this.message.set(res.message);
          this.state.set('success');
        },
        error: (err) => {
          this.message.set(err?.error?.message ?? 'Verification failed. The link may be expired or invalid.');
          this.state.set('error');
        },
      });
  }
}
