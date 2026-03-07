import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient }                           from '@angular/common/http';
import { AuthService }                          from '../auth/auth.service';
import { environment }                          from '../../../../environments/environment';
import { NotificationDto }                      from '../../../shared/models/notification.dto';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly base        = `${environment.apiUrl}/notifications`;

  readonly notifications  = signal<NotificationDto[]>([]);
  readonly unreadCount    = computed(() => this.notifications().filter(n => !n.read).length);
  readonly panelOpen      = signal(false);

  /** Call once after login or on app init when user is already logged in. */
  load(): void {
    if (!this.authService.isLoggedIn()) return;
    this.http.get<NotificationDto[]>(this.base).subscribe(list => this.notifications.set(list));
  }

  markAllRead(): void {
    this.http.put<void>(`${this.base}/read-all`, {}).subscribe(() => {
      this.notifications.update(list => list.map(n => ({ ...n, read: true })));
    });
  }

  markRead(id: string): void {
    const n = this.notifications().find(x => x.id === id);
    if (!n || n.read) return;
    this.http.put<void>(`${this.base}/${id}/read`, {}).subscribe(() => {
      this.notifications.update(list =>
        list.map(x => x.id === id ? { ...x, read: true } : x)
      );
    });
  }

  dismiss(id: string): void {
    this.http.delete<void>(`${this.base}/${id}`).subscribe(() => {
      this.notifications.update(list => list.filter(n => n.id !== id));
    });
  }

  togglePanel(): void { this.panelOpen.update(v => !v); }
  closePanel():  void { this.panelOpen.set(false);       }
}