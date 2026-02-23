import {
  Component, signal, ChangeDetectionStrategy, HostListener,
} from '@angular/core';
import { RouterLink, RouterLinkActive }      from '@angular/router';
import { MatButtonModule }                   from '@angular/material/button';
import { MatIconModule }                     from '@angular/material/icon';
import { HikerLogoComponent }                from '../../../shared/components/hiker-logo/hiker-logo.component';
import { SearchOverlayComponent }            from '../../../shared/components/search-overlay/search-overlay.component';

@Component({
  selector: 'hb-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, RouterLinkActive,
    MatButtonModule, MatIconModule,
    HikerLogoComponent, SearchOverlayComponent,
  ],
  templateUrl: './navbar.component.html',
  styleUrl:    './navbar.component.scss',
})
export class NavbarComponent {
  readonly searchOpen = signal(false);
  readonly menuOpen   = signal(false);

  openSearch():  void { this.searchOpen.set(true);          }
  closeSearch(): void { this.searchOpen.set(false);         }
  toggleMenu():  void { this.menuOpen.update(v => !v);      }
  closeMenu():   void { this.menuOpen.set(false);           }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeSearch();
    this.closeMenu();
  }

  readonly navLinks = [
    { label: 'About us', routerLink: '/',        fragment: 'about'   },
    { label: 'Gallery',  routerLink: '/gallery', fragment: undefined },
    { label: 'Contact',  routerLink: '/contact', fragment: undefined },
  ] as const;
}
