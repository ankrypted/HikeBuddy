import { Injectable, inject, signal } from '@angular/core';
import { HttpClient }                 from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { AuthService }               from '../auth/auth.service';
import { UserProfileDto, UpdateProfileRequestDto, UpdatePasswordRequestDto } from '../../../shared/models/user.dto';
import { environment }               from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly base        = `${environment.apiUrl}/users/me`;

  private readonly _profile = signal<UserProfileDto | null>(null);
  private readonly _loading = signal(false);
  private readonly _saving  = signal(false);

  readonly profile = this._profile.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving  = this._saving.asReadonly();

  loadProfile(): void {
    this._loading.set(true);
    this.http.get<UserProfileDto>(this.base).subscribe({
      next: p => {
        this._profile.set(p);
        this._loading.set(false);
      },
      error: () => {
        // Backend unavailable — build a minimal profile from JWT claims
        const user = this.authService.currentUser();
        if (user) {
          this._profile.set({
            id:        user.id,
            username:  user.username,
            avatarUrl: user.avatarUrl,
            email:     '',
            bio:       null,
            provider:  this.authService.provider() ?? 'LOCAL',
            joinedAt:  '',
          });
        }
        this._loading.set(false);
      },
    });
  }

  updateProfile(dto: UpdateProfileRequestDto): Observable<UserProfileDto> {
    this._saving.set(true);
    return this.http.patch<UserProfileDto>(this.base, dto).pipe(
      tap(updated => {
        this._profile.set(updated);
        this.authService.patchCurrentUser({ username: updated.username, avatarUrl: updated.avatarUrl });
        this._saving.set(false);
      }),
      catchError(err => {
        this._saving.set(false);
        return throwError(() => err);
      }),
    );
  }

  changePassword(dto: UpdatePasswordRequestDto): Observable<void> {
    this._saving.set(true);
    return this.http.put<void>(`${this.base}/password`, dto).pipe(
      tap(() => this._saving.set(false)),
      catchError(err => {
        this._saving.set(false);
        return throwError(() => err);
      }),
    );
  }
}
