import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink }          from '@angular/router';
import { NavbarComponent }             from '../../../core/layout/navbar/navbar.component';
import { SceneBackgroundComponent }    from '../../../shared/components/scene-background/scene-background.component';
import { AuthService }                 from '../../../core/services/auth/auth.service';
import { environment }                 from '../../../../environments/environment';

@Component({
  selector: 'hb-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, NavbarComponent, SceneBackgroundComponent],
  templateUrl: './login.component.html',
  styleUrl:    './login.component.scss',
})
export class LoginComponent {
  private readonly fb          = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);

  readonly loading      = signal(false);
  readonly serverError  = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  get f() { return this.form.controls; }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.serverError.set(null);

    this.authService.login({
      email:    this.f['email'].value!,
      password: this.f['password'].value!,
    }).subscribe({
      next:  () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.serverError.set(err?.error?.message ?? 'Login failed. Please check your credentials.');
        this.loading.set(false);
      },
    });
  }

  signInWithGoogle(): void {
    window.location.href = `${environment.backendUrl}/oauth2/authorization/google`;
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }
}
