import {
  Component, signal, effect, viewChild, ElementRef,
  ChangeDetectionStrategy, inject, OnDestroy,
} from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { MessageService }   from '../../../core/services/message/message.service';
import { ConversationDto, MessageDto } from '../../models/message.dto';
import { Router, RouterLink } from '@angular/router'

@Component({
  selector:        'hb-chat-widget',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [RouterLink],
  templateUrl:     './chat-widget.component.html',
  styleUrl:        './chat-widget.component.scss',
})
export class ChatWidgetComponent implements OnDestroy {

  private readonly messageService = inject(MessageService);

  // ── Panel / view state ────────────────────────────────────────────────────
  readonly open              = signal(false);
  readonly activeConvo       = signal<ConversationDto | null>(null);
  readonly messages          = signal<MessageDto[]>([]);
  readonly loadingMessages   = signal(false);
  readonly draft             = signal('');
  readonly sending           = signal(false);

  // ── Forwarded from service ────────────────────────────────────────────────
  readonly conversations = this.messageService.conversations;
  readonly totalUnread   = this.messageService.totalUnread;

  // ── Thread polling (5 s while a thread is open) ───────────────────────────
  private threadPollSub: Subscription | null = null;

  // ── Auto-scroll to bottom when messages change ────────────────────────────
  private readonly messagesEl = viewChild<ElementRef<HTMLDivElement>>('msgContainer');

  constructor() {
    // Auto-scroll when new messages arrive
    effect(() => {
      const msgs = this.messages();
      if (msgs.length) {
        requestAnimationFrame(() => {
          const el = this.messagesEl()?.nativeElement;
          if (el) el.scrollTop = el.scrollHeight;
        });
      }
    });

    // React to openChatWith() calls from other pages
    effect(() => {
      const username = this.messageService.pendingChatUser();
      if (!username) return;
      this.messageService.pendingChatUser.set(null);
      this.open.set(true);
      this.loadingMessages.set(true);
      this.messageService.loadConversations();
      this.messageService.getOrCreateConversation(username).subscribe({
        next: convo => {
          this.messageService.conversations.update(list => {
            const exists = list.some(c => c.id === convo.id);
            return exists ? list : [convo, ...list];
          });
          this.openThread(convo);
        },
        error: () => {
          this.loadingMessages.set(false);
        },
      });
    }, { allowSignalWrites: true });
  }

  ngOnDestroy(): void {
    this.stopThreadPoll();
  }

  // ── Toggle widget ─────────────────────────────────────────────────────────
  toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next) {
      this.messageService.loadConversations();
    } else {
      this.closeThread();
      this.loadingMessages.set(false);
    }
  }

  // ── Open a conversation thread ────────────────────────────────────────────
  openThread(convo: ConversationDto): void {
    this.activeConvo.set(convo);
    this.messages.set([]);
    this.draft.set('');
    this.loadingMessages.set(true);

    this.messageService.getMessages(convo.id).subscribe(msgs => {
      this.messages.set(msgs);
      this.loadingMessages.set(false);
    });

    this.messageService.markRead(convo.id);
    this.startThreadPoll(convo.id);
  }

  closeThread(): void {
    this.activeConvo.set(null);
    this.messages.set([]);
    this.stopThreadPoll();
  }

  // ── Send a message ────────────────────────────────────────────────────────
  sendMessage(): void {
    const text  = this.draft().trim();
    const convo = this.activeConvo();
    if (!text || !convo || this.sending()) return;

    this.sending.set(true);
    this.draft.set('');
    this.messageService.sendMessage(convo.id, text).subscribe({
      next: msg => {
        this.messages.update(list => [...list, msg]);
        this.messageService.loadConversations();
        this.sending.set(false);
      },
      error: () => {
        this.draft.set(text);
        this.sending.set(false);
      },
    });
  }

  // ── Thread polling helpers ────────────────────────────────────────────────
  private startThreadPoll(conversationId: string): void {
    this.stopThreadPoll();
    this.threadPollSub = interval(5_000).subscribe(() => {
      this.messageService.getMessages(conversationId).subscribe(msgs => {
        this.messages.set(msgs);
      });
    });
  }

  private stopThreadPoll(): void {
    this.threadPollSub?.unsubscribe();
    this.threadPollSub = null;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  initials(username: string): string {
    return username.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || '?';
  }

  updateDraft(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
  }

  onDraftKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

}
