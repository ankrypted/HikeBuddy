import {
  Component, signal, ChangeDetectionStrategy, HostListener, inject, computed, effect, ElementRef,
} from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatButtonModule }                   from '@angular/material/button';
import { MatIconModule }                     from '@angular/material/icon';
import { MatMenuModule }                     from '@angular/material/menu';
import { MatDividerModule }                  from '@angular/material/divider';
import { toSignal }                          from '@angular/core/rxjs-interop';
import { filter, map, startWith }            from 'rxjs';
import { HikerLogoComponent }                from '../../../shared/components/hiker-logo/hiker-logo.component';
import { SearchOverlayComponent }            from '../../../shared/components/search-overlay/search-overlay.component';
import { AuthService }                       from '../../services/auth/auth.service';
import { NotificationService }               from '../../services/notification/notification.service';
import { MessageService }                    from '../../services/message/message.service';
import { SearchService }                     from '../../services/search/search.service';
import { ComposeService }                    from '../../services/compose/compose.service';

@Component({
  selector: 'hb-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, RouterLinkActive,
    MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule,
    HikerLogoComponent, SearchOverlayComponent,
  ],
  templateUrl: './navbar.component.html',
  styleUrl:    './navbar.component.scss',
})
export class NavbarComponent {
  private readonly authService    = inject(AuthService);
  private readonly router         = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly searchService  = inject(SearchService);
  private readonly composeService = inject(ComposeService);
  private readonly elRef          = inject(ElementRef);
  readonly notificationService    = inject(NotificationService);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e  => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url),
    ),
  );

  readonly isLoggedIn   = this.authService.isLoggedIn;
  readonly currentUser  = this.authService.currentUser;
  readonly onDashboard  = computed(() => this.currentUrl()?.startsWith('/dashboard') ?? false);
  readonly searchOpen   = signal(false);

  constructor() {
    const seenRequest = this.searchService.openRequest();
    effect(() => {
      if (this.searchService.openRequest() > seenRequest) this.searchOpen.set(true);
    }, { allowSignalWrites: true });
  }
  readonly menuOpen        = signal(false);
  readonly navAvatarFailed = signal(false);

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/', { replaceUrl: true });
  }

  openSearch():   void { this.searchOpen.set(true);                    }
  closeSearch():  void { this.searchOpen.set(false);                   }
  openCompose():  void { this.composeService.requestOpen(); }
  openMessages(): void { this.messageService.requestOpenPanel();       }
  toggleMenu():  void { this.notificationService.closePanel(); this.menuOpen.update(v => !v); }
  closeMenu():   void { this.menuOpen.set(false);           }

  toggleNotifPanel(): void {
    this.menuOpen.set(false);
    this.notificationService.togglePanel();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeSearch();
    this.closeMenu();
    this.notificationService.closePanel();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.notificationService.closePanel();
    }
  }

  onNavAvatarError(): void {
    this.navAvatarFailed.set(true);
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

  initials(username: string | undefined): string {
    if (!username) return '?';
    return username.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || '?';
  }

  readonly navLinks = [
    { label: 'Home',    routerLink: '/',        fragment: undefined },
    { label: 'Explore', routerLink: '/trails',  fragment: undefined },
    { label: 'Map',     routerLink: '/map',     fragment: undefined },
    { label: 'Contact', routerLink: '/contact', fragment: undefined },
  ] as const;
}
