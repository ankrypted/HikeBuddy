import { Component, ChangeDetectionStrategy, inject, HostListener, ElementRef } from '@angular/core';
import { RouterLink, RouterLinkActive }                                          from '@angular/router';
import { SearchService }                                             from '../../../core/services/search/search.service';
import { MessageService }                                            from '../../../core/services/message/message.service';
import { NotificationService }                                       from '../../../core/services/notification/notification.service';
import { ComposeService }                                            from '../../../core/services/compose/compose.service';

@Component({
  selector:        'hb-mobile-bottom-nav',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [RouterLink, RouterLinkActive],
  templateUrl:     './mobile-bottom-nav.component.html',
  styleUrl:        './mobile-bottom-nav.component.scss',
})
export class MobileBottomNavComponent {
  private readonly searchService  = inject(SearchService);
  private readonly messageService = inject(MessageService);
  private readonly composeService = inject(ComposeService);
  private readonly elRef          = inject(ElementRef);
  readonly notifService           = inject(NotificationService);

  openSearch():       void { this.searchService.requestOpen();       }
  openMessages():     void { this.messageService.requestOpenPanel(); }
  toggleNotifPanel(): void { this.notifService.togglePanel();        }
  openCompose():      void { this.composeService.requestOpen();      }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.notifService.closePanel(); }

  @HostListener('document:click', ['$event'])
  onDocClick(event: Event): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.notifService.closePanel();
    }
  }

  timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return d < 7 ? `${d}d ago` : new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}
