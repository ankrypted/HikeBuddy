import { Injectable, inject, signal } from '@angular/core';
import { HttpClient }                 from '@angular/common/http';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { AuthService }               from '../auth/auth.service';
import { UserProfileDto, UpdateProfileRequestDto, UpdateProfileResponseDto, UpdatePasswordRequestDto } from '../../../shared/models/user.dto';
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
    return this.http.patch<UpdateProfileResponseDto>(this.base, dto).pipe(
      tap(res => {
        this._profile.set(res.profile);
        if (res.newToken) {
          this.authService.replaceToken(res.newToken);
        } else {
          this.authService.patchCurrentUser({ username: res.profile.username, avatarUrl: res.profile.avatarUrl });
        }
        this._saving.set(false);
      }),
      map(res => res.profile),
      catchError(err => {
        this._saving.set(false);
        return throwError(() => err);
      }),
    );
  }

  uploadAvatar(file: File): Observable<string> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ avatarUrl: string }>(`${this.base}/avatar`, form).pipe(
      tap(res => {
        this._profile.update(p => p ? { ...p, avatarUrl: res.avatarUrl } : p);
        this.authService.patchCurrentUser({ avatarUrl: res.avatarUrl });
      }),
      map(res => res.avatarUrl),
      catchError(err => throwError(() => err)),
    );
  }

  checkUsername(username: string): Observable<boolean> {
    const params = { username };
    return this.http
      .get<{ available: boolean }>(`${environment.apiUrl}/users/check-username`, { params })
      .pipe(map(r => r.available));
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
