import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { MatIconModule }      from '@angular/material/icon';
import { NavbarComponent }    from '../../core/layout/navbar/navbar.component';
import { HikersBgComponent }  from '../../shared/components/hikers-bg/hikers-bg.component';
import { toSignal }           from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

interface NavItem {
  icon:       string;
  label:      string;
  route:      string | null;
  exact:      boolean;
  comingSoon?: boolean;
}

@Component({
  selector: 'hb-dashboard-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NavbarComponent, HikersBgComponent, RouterLink, RouterLinkActive, RouterOutlet, MatIconModule],
  templateUrl: './dashboard-shell.component.html',
  styleUrl:    './dashboard-shell.component.scss',
})
export class DashboardShellComponent {
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e  => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url),
    ),
  );

  // True when on the /dashboard overview — sidebar is hidden there
  readonly onOverview = computed(() => this.currentUrl() === '/dashboard');

  // Start collapsed on mobile so the overlay doesn't cover content on load
  readonly collapsed = signal(
    typeof window !== 'undefined' && window.innerWidth <= 640,
  );

  toggle(): void { this.collapsed.update(v => !v); }

  readonly navItems: NavItem[] = [
    { icon: 'grid_view',       label: 'Overview',     route: '/dashboard',           exact: true  },
    { icon: 'hiking',          label: 'My Trails',    route: '/dashboard/my-trails', exact: false },
    { icon: 'bookmark',        label: 'Saved Trails', route: '/dashboard/favorites', exact: false },
    { icon: 'star_outline',    label: 'My Reviews',   route: null,                   exact: false, comingSoon: true },
    { icon: 'emoji_events',    label: 'Achievements', route: null,                   exact: false, comingSoon: true },
    { icon: 'manage_accounts', label: 'Profile',      route: null,                   exact: false, comingSoon: true },
  ];
}
