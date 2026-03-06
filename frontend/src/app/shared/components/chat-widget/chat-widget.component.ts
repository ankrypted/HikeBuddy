import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

interface Conversation {
  id:          string;
  username:    string;
  lastMessage: string;
  time:        string;
  unread:      number;
}

@Component({
  selector:        'hb-chat-widget',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [],
  templateUrl:     './chat-widget.component.html',
  styleUrl:        './chat-widget.component.scss',
})
export class ChatWidgetComponent {
  readonly open = signal(false);

  readonly conversations: Conversation[] = [
    { id: '1', username: 'RidgeRunner',  lastMessage: 'That trail was amazing!',          time: '2m',       unread: 2 },
    { id: '2', username: 'SummitChaser', lastMessage: 'Are you going this weekend?',       time: '1h',       unread: 0 },
    { id: '3', username: 'TrailMaven',   lastMessage: 'Check out the new route I found',   time: '3h',       unread: 1 },
    { id: '4', username: 'PeakWalker',   lastMessage: 'Great photo! Which trail was it?',  time: 'Yesterday', unread: 0 },
  ];

  readonly totalUnread = this.conversations.reduce((sum, c) => sum + c.unread, 0);

  toggle(): void {
    this.open.update(v => !v);
  }

  initials(username: string): string {
    return username.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || '?';
  }
}
