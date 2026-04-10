import {
  Component, OnInit, signal, inject, ChangeDetectionStrategy, computed,
} from '@angular/core';
import { RouterLink }              from '@angular/router';
import { NotificationService }     from '../../core/services/notification/notification.service';
import { NotificationDto }         from '../../shared/models/notification.dto';
import { environment }             from '../../../environments/environment';
import { HttpClient }              from '@angular/common/http';
import { AuthService }             from '../../core/services/auth/auth.service';
import { UserService }             from '../../core/services/user/user.service';
import { TrailService }            from '../../core/services/trail/trail.service';
import { FavoritesService }        from '../../core/services/favorites/favorites.service';
import { CompletedTrailsService }  from '../../core/services/completed-trails/completed-trails.service';
import { PublicUserDto }           from '../../shared/models/public-user.dto';
import { TrailSummaryDto }         from '../../shared/models/trail.dto';
import { RoomService }             from '../../core/services/room/room.service';

interface PagedResponse {
  content:       NotificationDto[];
  totalElements: number;
  totalPages:    number;
  number:        number;
}

@Component({
  selector:        'hb-notifications',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [RouterLink],
  templateUrl:     './notifications.component.html',
  styleUrl:        './notifications.component.scss',
})
export class NotificationsComponent implements OnInit {
  private readonly http             = inject(HttpClient);
  readonly notifService             = inject(NotificationService);
  private readonly authService      = inject(AuthService);
  private readonly userService      = inject(UserService);
  private readonly trailService     = inject(TrailService);
  private readonly favoritesService = inject(FavoritesService);
  private readonly completedService = inject(CompletedTrailsService);
  private readonly roomService      = inject(RoomService);
  private readonly base             = `${environment.apiUrl}/notifications`;

  readonly acceptingInvite = signal<Set<string>>(new Set());

  readonly items            = signal<NotificationDto[]>([]);
  readonly page             = signal(0);
  readonly totalPages       = signal(0);
  readonly totalItems       = signal(0);
  readonly loading          = signal(false);
  readonly failedAvatars    = signal<ReadonlySet<string>>(new Set());
  readonly subscribersCount = signal<number>(0);
  private readonly allUsers = signal<PublicUserDto[]>([]);
  readonly suggestedTrails  = signal<TrailSummaryDto[]>([]);

  readonly completedCount  = this.completedService.count;
  readonly savedCount      = this.favoritesService.count;
  readonly followingCount  = computed(() => this.userService.subscriptions().size);

  readonly suggestedHikers = computed(() => {
    const subs = this.userService.subscriptions();
    const me   = this.authService.currentUser()?.username;
    return this.allUsers().filter(p => !subs.has(p.username) && p.username !== me).slice(0, 3);
  });

  readonly pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i)
  );

  ngOnInit(): void {
    this.loadPage(0);
    const username = this.authService.currentUser()?.username;
    if (username) {
      this.userService.getPublicProfile(username).subscribe(p => this.subscribersCount.set(p.subscribersCount));
    }
    this.userService.getPublicProfiles().subscribe(all => this.allUsers.set(all));
    this.trailService.getAllTrails().subscribe(trails => {
      const top = trails
        .filter(t => t.isFeatured)
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 4);
      this.suggestedTrails.set(top);
    });
  }

  loadPage(p: number): void {
    this.loading.set(true);
    this.http.get<PagedResponse>(`${this.base}/all?page=${p}&size=20`).subscribe({
      next: res => {
        this.items.set(res.content);
        this.page.set(res.number);
        this.totalPages.set(res.totalPages);
        this.totalItems.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  markRead(id: string): void {
    this.notifService.markRead(id);
    this.items.update(list =>
      list.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  dismiss(id: string): void {
    this.notifService.dismiss(id);
    this.items.update(list => list.filter(n => n.id !== id));
    this.totalItems.update(v => v - 1);
  }

  markAllRead(): void {
    this.notifService.markAllRead();
    this.items.update(list => list.map(n => ({ ...n, read: true })));
  }

  acceptInvite(n: NotificationDto): void {
    this.acceptingInvite.update(s => new Set([...s, n.id]));
    this.roomService.joinRoom(n.eventId).subscribe({
      next:  () => { this.dismiss(n.id); this.acceptingInvite.update(s => { const ns = new Set(s); ns.delete(n.id); return ns; }); },
      error: () => { this.acceptingInvite.update(s => { const ns = new Set(s); ns.delete(n.id); return ns; }); },
    });
  }

  declineInvite(n: NotificationDto): void {
    this.dismiss(n.id);
  }

  approveJoinRequest(n: NotificationDto): void {
    this.acceptingInvite.update(s => new Set([...s, n.id]));
    this.roomService.approveJoinRequest(n.eventId).subscribe({
      next:  () => { this.dismiss(n.id); this.acceptingInvite.update(s => { const ns = new Set(s); ns.delete(n.id); return ns; }); },
      error: () => { this.acceptingInvite.update(s => { const ns = new Set(s); ns.delete(n.id); return ns; }); },
    });
  }

  declineJoinRequest(n: NotificationDto): void {
    this.roomService.declineJoinRequest(n.eventId).subscribe();
    this.dismiss(n.id);
  }

  onAvatarError(username: string): void {
    this.failedAvatars.update(s => new Set([...s, username]));
  }

  timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7)  return `${d}d ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  initials(username: string): string {
    return username.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || '?';
  }

  typeLabel(type: string): string {
    if (type === 'LIKE')         return '♥ liked';
    if (type === 'SUBSCRIPTION') return '👤 subscribed to you';
    if (type === 'ROOM_INVITE')  return '🏕️ room invite';
    if (type === 'JOIN_REQUEST') return '🚪 join request';
    return '💬 commented';
  }
}
