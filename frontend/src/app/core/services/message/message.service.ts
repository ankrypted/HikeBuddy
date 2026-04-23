import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient }                           from '@angular/common/http';
import { Observable, Subscription, interval, EMPTY } from 'rxjs';
import { map }                                  from 'rxjs/operators';
import { RxStomp }                              from '@stomp/rx-stomp';
import { AuthService }                          from '../auth/auth.service';
import { environment }                          from '../../../../environments/environment';
import { ConversationDto, MessageDto }          from '../../../shared/models/message.dto';

@Injectable({ providedIn: 'root' })
export class MessageService {

  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly base        = `${environment.apiUrl}/messages`;

  readonly conversations   = signal<ConversationDto[]>([]);
  readonly totalUnread     = computed(() =>
    this.conversations().reduce((sum, c) => sum + c.unreadCount, 0),
  );
  /** Set by any component to make the chat widget open a specific conversation. */
  readonly pendingChatUser = signal<string | null>(null);
  /** Incremented to request the chat panel to open (any value change triggers it). */
  readonly openPanelRequest = signal(0);

  requestOpenPanel(): void { this.openPanelRequest.update(n => n + 1); }

  private pollSub: Subscription | null = null;
  private rxStomp: RxStomp | null = null;

  loadConversations(): void {
    if (!this.authService.isLoggedIn()) return;
    this.http.get<ConversationDto[]>(`${this.base}/conversations`)
      .subscribe({ next: list => this.conversations.set(list), error: () => {} });
  }

  getMessages(conversationId: string): Observable<MessageDto[]> {
    return this.http.get<MessageDto[]>(`${this.base}/conversations/${conversationId}`);
  }

  getOrCreateConversation(username: string): Observable<ConversationDto> {
    return this.http.post<ConversationDto>(`${this.base}/conversations/with/${username}`, {});
  }

  markRead(conversationId: string): void {
    this.http.put<void>(`${this.base}/conversations/${conversationId}/read`, {}).subscribe();
    this.conversations.update(list =>
      list.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c),
    );
  }

  openChatWith(username: string): void {
    this.pendingChatUser.set(username);
  }

  // ── WebSocket DM ──────────────────────────────────────────────────────────

  connectDm(conversationId: string): Observable<MessageDto> {
    const token = this.authService.accessToken();
    if (!token) return EMPTY;

    this.rxStomp = new RxStomp();
    this.rxStomp.configure({
      brokerURL:      environment.wsUrl,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5_000,
    });
    this.rxStomp.activate();

    const myUsername = this.authService.currentUser()?.username;

    return this.rxStomp.watch(`/topic/dm/${conversationId}`).pipe(
      map(frame => {
        const raw: MessageDto = JSON.parse(frame.body);
        return { ...raw, mine: raw.senderUsername === myUsername };
      }),
    );
  }

  disconnectDm(): void {
    this.rxStomp?.deactivate();
    this.rxStomp = null;
  }

  sendDm(conversationId: string, body: string): void {
    this.rxStomp?.publish({
      destination: `/app/dm/${conversationId}`,
      body: JSON.stringify({ body }),
    });
  }

  // ── Conversation list polling (30 s) ──────────────────────────────────────

  startPolling(): void {
    if (this.pollSub) return;
    this.pollSub = interval(30_000).subscribe(() => this.loadConversations());
  }

  stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = null;
  }
}
