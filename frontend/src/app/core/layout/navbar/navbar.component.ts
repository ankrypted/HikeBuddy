import {
  Component, signal, ChangeDetectionStrategy, HostListener, inject, computed,
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
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);

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
  readonly onFeed       = computed(() => this.currentUrl()?.startsWith('/feed') ?? false);
  readonly searchOpen   = signal(false);
  readonly menuOpen     = signal(false);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  openSearch():  void { this.searchOpen.set(true);          }
  closeSearch(): void { this.searchOpen.set(false);         }
  toggleMenu():  void { this.menuOpen.update(v => !v);      }
  closeMenu():   void { this.menuOpen.set(false);           }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeSearch();
    this.closeMenu();
  }

  initials(username: string | undefined): string {
    if (!username) return '?';
    return username.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || '?';
  }

  readonly navLinks = [
    { label: 'Home',    routerLink: '/',        fragment: undefined },
    { label: 'Gallery', routerLink: '/gallery', fragment: undefined },
    { label: 'Contact', routerLink: '/contact', fragment: undefined },
  ] as const;
}
