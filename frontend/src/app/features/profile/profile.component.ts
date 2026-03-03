import {
  ChangeDetectionStrategy, Component, OnInit,
  effect, inject, signal, untracked,
} from '@angular/core';
import { DatePipe }         from '@angular/common';
import { AuthService }      from '../../core/services/auth/auth.service';
import { ProfileService }   from '../../core/services/profile/profile.service';
import { ToastService }     from '../../core/services/toast/toast.service';

@Component({
  selector: 'hb-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './profile.component.html',
  styleUrl:    './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  protected readonly authService    = inject(AuthService);
  protected readonly profileService = inject(ProfileService);
  private   readonly toastService   = inject(ToastService);

  readonly profile = this.profileService.profile;
  readonly loading = this.profileService.loading;

  // ── Bio ─────────────────────────────────────────────────────────────────
  readonly bio       = signal('');
  readonly bioSaving = signal(false);

  // ── Avatar (LOCAL only) ──────────────────────────────────────────────────
  readonly avatarUrl        = signal('');
  readonly avatarPreviewUrl = signal('');
  readonly avatarSaving     = signal(false);

  // ── Password (LOCAL only) ────────────────────────────────────────────────
  readonly currentPassword = signal('');
  readonly newPassword     = signal('');
  readonly confirmPassword = signal('');
  readonly passwordSaving  = signal(false);
  readonly passwordError   = signal<string | null>(null);

  private profileInitialized = false;

  constructor() {
    // One-time sync: populate edit fields when the profile first loads
    effect(() => {
      const p = this.profile();
      if (!p || this.profileInitialized) return;
      this.profileInitialized = true;
      untracked(() => {
        this.bio.set(p.bio ?? '');
        this.avatarUrl.set(p.avatarUrl ?? '');
        this.avatarPreviewUrl.set(p.avatarUrl ?? '');
      });
    });
  }

  ngOnInit(): void {
    this.profileService.loadProfile();
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  saveBio(): void {
    this.bioSaving.set(true);
    this.profileService.updateProfile({ bio: this.bio() }).subscribe({
      next: () => {
        this.toastService.show('Bio saved.', 'success');
        this.bioSaving.set(false);
      },
      error: () => {
        this.toastService.show('Could not save bio. Please try again.', 'error');
        this.bioSaving.set(false);
      },
    });
  }

  onAvatarUrlInput(value: string): void {
    this.avatarUrl.set(value);
    // Show preview immediately while the user types
    this.avatarPreviewUrl.set(value);
  }

  saveAvatar(): void {
    this.avatarSaving.set(true);
    this.profileService.updateProfile({ avatarUrl: this.avatarUrl() }).subscribe({
      next: () => {
        this.toastService.show('Avatar updated.', 'success');
        this.avatarSaving.set(false);
      },
      error: () => {
        this.toastService.show('Could not update avatar. Please try again.', 'error');
        this.avatarSaving.set(false);
      },
    });
  }

  changePassword(): void {
    this.passwordError.set(null);

    if (this.newPassword() !== this.confirmPassword()) {
      this.passwordError.set('New passwords do not match.');
      return;
    }
    if (this.newPassword().length < 8) {
      this.passwordError.set('New password must be at least 8 characters.');
      return;
    }

    this.passwordSaving.set(true);
    this.profileService.changePassword({
      currentPassword: this.currentPassword(),
      newPassword:     this.newPassword(),
    }).subscribe({
      next: () => {
        this.toastService.show('Password changed successfully.', 'success');
        this.passwordSaving.set(false);
        this.currentPassword.set('');
        this.newPassword.set('');
        this.confirmPassword.set('');
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Could not change password. Check your current password and try again.';
        this.passwordError.set(msg);
        this.passwordSaving.set(false);
      },
    });
  }
}
