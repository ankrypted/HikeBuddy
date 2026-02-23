import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient }                            from '@angular/common/http';
import { tap }                                   from 'rxjs';
import { environment }                           from '../../../../environments/environment';
import {
  LoginRequestDto, RegisterRequestDto,
  AuthResponseDto, UserSummaryDto, UserRole,
} from '../../../shared/models/user.dto';

const TOKEN_KEY   = 'hb_access_token';
const REFRESH_KEY = 'hb_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/auth`;

  // ─── Signals ──────────────────────────────────────────────────────
  readonly accessToken = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly currentUser = signal<UserSummaryDto | null>(null);
  readonly roles       = signal<UserRole[]>([]);
  readonly isLoggedIn  = computed(() => this.accessToken() !== null);
  readonly isAdmin     = computed(() => this.roles().includes('ROLE_ADMIN'));

  login(dto: LoginRequestDto) {
    return this.http.post<AuthResponseDto>(`${this.base}/login`, dto).pipe(
      tap(res => this.handleAuth(res)),
    );
  }

  register(dto: RegisterRequestDto) {
    return this.http.post<AuthResponseDto>(`${this.base}/register`, dto).pipe(
      tap(res => this.handleAuth(res)),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this.accessToken.set(null);
    this.currentUser.set(null);
    this.roles.set([]);
  }

  private handleAuth(res: AuthResponseDto): void {
    localStorage.setItem(TOKEN_KEY,   res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    this.accessToken.set(res.accessToken);
    this.currentUser.set(res.user);
    this.roles.set(res.roles);
  }
}
