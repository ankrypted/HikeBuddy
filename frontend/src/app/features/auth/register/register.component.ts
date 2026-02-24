import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink }          from '@angular/router';
import { NavbarComponent }             from '../../../core/layout/navbar/navbar.component';
import { SceneBackgroundComponent }    from '../../../shared/components/scene-background/scene-background.component';
import { AuthService }                 from '../../../core/services/auth/auth.service';
import { environment }                 from '../../../../environments/environment';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm  = control.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'hb-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, NavbarComponent, SceneBackgroundComponent],
  templateUrl: './register.component.html',
  styleUrl:    './register.component.scss',
})
export class RegisterComponent {
  private readonly fb          = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);

  readonly loading      = signal(false);
  readonly serverError  = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly form = this.fb.group(
    {
      username:        ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email:           ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  get f() { return this.form.controls; }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.serverError.set(null);

    this.authService.register({
      username: this.f['username'].value!,
      email:    this.f['email'].value!,
      password: this.f['password'].value!,
    }).subscribe({
      next:  () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.serverError.set(err?.error?.message ?? 'Registration failed. Please try again.');
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
