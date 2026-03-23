import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterLink }  from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
  selector: 'hb-hiker-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './hiker-logo.component.html',
  styleUrl:    './hiker-logo.component.scss',
})
export class HikerLogoComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  readonly logoLink = computed(() => this.authService.isLoggedIn() ? '/feed' : '/');

  readonly displayText  = signal('');
  readonly showCursor   = signal(true);

  private readonly FULL_TEXT          = 'HikeBuddy';
  private readonly TYPE_SPEED         = 110;   // ms per char while typing
  private readonly ERASE_SPEED        = 70;    // ms per char while erasing
  private readonly PAUSE_AFTER_TYPE   = 1800;  // ms pause when fully typed
  private readonly PAUSE_AFTER_ERASE  = 500;   // ms pause before retyping
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.type(0);
  }

  ngOnDestroy(): void {
    if (this.timeoutId) clearTimeout(this.timeoutId);
  }

  private type(i: number): void {
    if (i <= this.FULL_TEXT.length) {
      this.displayText.set(this.FULL_TEXT.slice(0, i));
      if (i === this.FULL_TEXT.length) {
        this.timeoutId = setTimeout(() => this.erase(i), this.PAUSE_AFTER_TYPE);
      } else {
        this.timeoutId = setTimeout(() => this.type(i + 1), this.TYPE_SPEED);
      }
    }
  }

  private erase(i: number): void {
    if (i >= 0) {
      this.displayText.set(this.FULL_TEXT.slice(0, i));
      if (i === 0) {
        this.timeoutId = setTimeout(() => this.type(0), this.PAUSE_AFTER_ERASE);
      } else {
        this.timeoutId = setTimeout(() => this.erase(i - 1), this.ERASE_SPEED);
      }
    }
  }
}
