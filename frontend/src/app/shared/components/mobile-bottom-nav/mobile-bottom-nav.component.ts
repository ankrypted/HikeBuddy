import { Component, ChangeDetectionStrategy, inject, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, Router }                      from '@angular/router';
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
  private readonly router         = inject(Router);
  readonly notifService           = inject(NotificationService);

  openSearch():    void { this.searchService.requestOpen();        }
  openMessages():  void { this.messageService.requestOpenPanel();  }
  openCompose():   void { this.composeService.requestOpen();       }
  openActivity():  void { this.router.navigate(['/dashboard/notifications']); }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.notifService.closePanel(); }

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
