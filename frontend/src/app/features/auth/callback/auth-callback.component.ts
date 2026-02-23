import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router }  from '@angular/router';
import { AuthService }             from '../../../core/services/auth/auth.service';

@Component({
  selector: 'hb-auth-callback',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="callback-page">
      <div class="spinner"></div>
      <p>Signing you in…</p>
    </div>
  `,
  styles: [`
    .callback-page {
      min-height: 100vh;
      background: #0d1b2a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.25rem;
      color: rgba(255,255,255,0.7);
      font-size: 1rem;
    }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid rgba(255,255,255,0.15);
      border-top-color: #7ecb3f;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class AuthCallbackComponent implements OnInit {
  private readonly route       = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);

  ngOnInit(): void {
    const token     = this.route.snapshot.queryParamMap.get('token');
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';

    if (token) {
      this.authService.handleOAuthCallback(token);
    }

    this.router.navigateByUrl(returnUrl, { replaceUrl: true });
  }
}
