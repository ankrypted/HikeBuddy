import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit, OnChanges,
  inject, signal, computed,
} from '@angular/core';
import { Router }          from '@angular/router';
import { toSignal }        from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule }   from '@angular/material/icon';
import { TrailService }    from '../../../core/services/trail/trail.service';
import { UserService }     from '../../../core/services/user/user.service';

@Component({
  selector: 'hb-search-overlay',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './search-overlay.component.html',
  styleUrl:    './search-overlay.component.scss',
})
export class SearchOverlayComponent implements AfterViewInit, OnChanges {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  private readonly router       = inject(Router);
  private readonly trailService = inject(TrailService);
  private readonly userService  = inject(UserService);

  private readonly allTrails = toSignal(this.trailService.getAllTrails(), { initialValue: [] });
  private readonly allUsers  = toSignal(this.userService.getPublicProfiles(), { initialValue: [] });

  readonly query = signal('');

  readonly trailResults = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return [];
    return this.allTrails()
      .filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.region.name.toLowerCase().includes(q),
      )
      .slice(0, 5);
  });

  readonly userResults = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return [];
    return this.allUsers()
      .filter(u => u.username.toLowerCase().includes(q))
      .slice(0, 3);
  });

  readonly hasResults = computed(() =>
    this.trailResults().length > 0 || this.userResults().length > 0,
  );

  ngAfterViewInit(): void {
    if (this.isOpen) this.focusInput();
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      setTimeout(() => this.focusInput(), 50);
    } else {
      this.query.set('');
    }
  }

  onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  navigateToTrail(slug: string): void {
    this.router.navigate(['/trails', slug]);
    this.close();
  }

  navigateToUser(username: string): void {
    this.router.navigate(['/users', username]);
    this.close();
  }

  initials(username: string): string {
    return username.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || '?';
  }

  close(): void {
    this.query.set('');
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('search-overlay')) {
      this.close();
    }
  }

  private focusInput(): void {
    this.searchInput?.nativeElement.focus();
  }
}
