import {
  ChangeDetectionStrategy, Component, OnDestroy, OnInit,
  effect, inject, signal, untracked,
} from '@angular/core';
import { DatePipe }         from '@angular/common';
import { Subscription }     from 'rxjs';
import { Router }           from '@angular/router';
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
export class ProfileComponent implements OnInit, OnDestroy {
  protected readonly authService    = inject(AuthService);
  protected readonly profileService = inject(ProfileService);
  private   readonly toastService   = inject(ToastService);
  private   readonly router         = inject(Router);

  readonly profile = this.profileService.profile;
  readonly loading = this.profileService.loading;

  // ── Username ─────────────────────────────────────────────────────────────
  readonly username          = signal('');
  readonly usernameSaving    = signal(false);
  readonly usernameError     = signal<string | null>(null);
  readonly usernameAvailable = signal<boolean | null>(null);  // null = not checked yet
  readonly usernameChecking  = signal(false);
  private  usernameDebounce: ReturnType<typeof setTimeout> | null = null;
  private  checkSub: Subscription | null = null;

  // ── Bio ─────────────────────────────────────────────────────────────────
  readonly bio       = signal('');
  readonly bioSaving = signal(false);

  // ── Avatar (LOCAL only) ──────────────────────────────────────────────────
  readonly avatarUrl        = signal('');
  readonly avatarPreviewUrl = signal('');
  readonly avatarSaving     = signal(false);
  readonly avatarUploading  = signal(false);

  // ── Password (LOCAL only) ────────────────────────────────────────────────
  readonly currentPassword = signal('');
  readonly newPassword     = signal('');
  readonly confirmPassword = signal('');
  readonly passwordSaving  = signal(false);
  readonly passwordError   = signal<string | null>(null);

  // ── Delete account ───────────────────────────────────────────────────────
  readonly deleting = signal(false);

  private profileInitialized = false;

  constructor() {
    // One-time sync: populate edit fields when the profile first loads
    effect(() => {
      const p = this.profile();
      if (!p || this.profileInitialized) return;
      this.profileInitialized = true;
      untracked(() => {
        this.username.set(p.username);
        this.bio.set(p.bio ?? '');
        this.avatarUrl.set(p.avatarUrl ?? '');
        this.avatarPreviewUrl.set(p.avatarUrl ?? '');
      });
    });
  }

  ngOnInit(): void {
    this.profileService.loadProfile();
  }

  ngOnDestroy(): void {
    if (this.usernameDebounce) clearTimeout(this.usernameDebounce);
    this.checkSub?.unsubscribe();
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  onUsernameInput(value: string): void {
    this.username.set(value);
    this.usernameError.set(null);
    this.usernameAvailable.set(null);

    if (this.usernameDebounce) clearTimeout(this.usernameDebounce);
    this.checkSub?.unsubscribe();

    const trimmed = value.trim();
    // Don't check if same as current, too short, or invalid chars
    if (!trimmed || trimmed === this.profile()?.username ||
        trimmed.length < 3 || !/^[a-zA-Z0-9_]+$/.test(trimmed)) return;

    this.usernameChecking.set(true);
    this.usernameDebounce = setTimeout(() => {
      this.checkSub = this.profileService.checkUsername(trimmed).subscribe({
        next:  available => { this.usernameAvailable.set(available); this.usernameChecking.set(false); },
        error: ()        => { this.usernameAvailable.set(null);      this.usernameChecking.set(false); },
      });
    }, 500);
  }

  saveUsername(): void {
    this.usernameError.set(null);
    const value = this.username().trim();
    if (value === this.profile()?.username) return;
    if (value.length < 3) {
      this.usernameError.set('Username must be at least 3 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      this.usernameError.set('Only letters, numbers, and underscores are allowed.');
      return;
    }
    if (this.usernameAvailable() === false) {
      this.usernameError.set('This username is already taken. Please choose another.');
      return;
    }
    this.usernameSaving.set(true);
    this.profileService.updateProfile({ username: value }).subscribe({
      next: () => {
        this.toastService.show('Username updated.', 'success');
        this.usernameSaving.set(false);
      },
      error: err => {
        const msg = err?.error?.message ?? 'Username may already be taken. Please try another.';
        this.usernameError.set(msg);
        this.usernameSaving.set(false);
      },
    });
  }

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

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.avatarPreviewUrl.set(URL.createObjectURL(file));
    this.avatarUploading.set(true);
    this.profileService.uploadAvatar(file).subscribe({
      next: url => {
        this.avatarUrl.set(url);
        this.toastService.show('Avatar updated.', 'success');
        this.avatarUploading.set(false);
      },
      error: () => {
        this.toastService.show('Upload failed. Please try again.', 'error');
        this.avatarUploading.set(false);
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

  deleteAccount(): void {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This will permanently remove all your data and cannot be undone.'
    );
    if (!confirmed) return;

    this.deleting.set(true);
    this.profileService.deleteAccount().subscribe({
      next: () => {
        this.authService.logout();
        this.router.navigate(['/']);
      },
      error: () => {
        this.toastService.show('Could not delete account. Please try again.', 'error');
        this.deleting.set(false);
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
