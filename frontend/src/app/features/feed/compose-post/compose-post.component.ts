import {
  Component, Output, EventEmitter, ChangeDetectionStrategy,
  signal, computed, inject, OnInit,
} from '@angular/core';
import { AuthService }     from '../../../core/services/auth/auth.service';
import { TrailService }    from '../../../core/services/trail/trail.service';
import { TrailSummaryDto } from '../../../shared/models/trail.dto';
import { HikePostDto }     from '../../../shared/models/hike-post.dto';

@Component({
  selector:        'hb-compose-post',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [],
  templateUrl:     './compose-post.component.html',
  styleUrl:        './compose-post.component.scss',
})
export class ComposePostComponent implements OnInit {
  private readonly authService  = inject(AuthService);
  private readonly trailService = inject(TrailService);

  @Output() close  = new EventEmitter<void>();
  @Output() posted = new EventEmitter<HikePostDto>();

  readonly currentUser   = this.authService.currentUser;
  readonly content       = signal('');
  readonly trailQuery    = signal('');
  readonly allTrails     = signal<TrailSummaryDto[]>([]);
  readonly selectedTrail = signal<TrailSummaryDto | null>(null);
  readonly avatarFailed  = signal(false);
  readonly submitting    = signal(false);

  readonly filteredTrails = computed(() => {
    if (this.selectedTrail()) return [];
    const q = this.trailQuery().trim().toLowerCase();
    if (!q) return [];
    return this.allTrails().filter(t => t.name.toLowerCase().includes(q)).slice(0, 6);
  });

  readonly canSubmit = computed(() =>
    this.content().trim().length > 0 && !this.submitting()
  );

  ngOnInit(): void {
    this.trailService.getAllTrails().subscribe(ts => this.allTrails.set(ts));
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('compose-overlay')) {
      this.close.emit();
    }
  }

  onContent(event: Event): void {
    this.content.set((event.target as HTMLTextAreaElement).value);
  }

  onSearch(event: Event): void {
    this.trailQuery.set((event.target as HTMLInputElement).value);
    this.selectedTrail.set(null);
  }

  selectTrail(trail: TrailSummaryDto): void {
    this.selectedTrail.set(trail);
    this.trailQuery.set(trail.name);
  }

  clearTrail(): void {
    this.selectedTrail.set(null);
    this.trailQuery.set('');
  }

  initials(username: string | undefined): string {
    if (!username) return '?';
    return username.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || '?';
  }

  submit(): void {
    if (!this.canSubmit()) return;
    const user  = this.currentUser();
    const trail = this.selectedTrail();
    this.submitting.set(true);

    const post: HikePostDto = {
      id:        'post-' + Date.now(),
      author:    { username: user?.username ?? 'you', avatarUrl: user?.avatarUrl ?? null },
      content:   this.content().trim(),
      trailName: trail?.name,
      trailSlug: trail?.slug,
      timestamp: new Date().toISOString(),
    };

    this.posted.emit(post);
    this.close.emit();
  }
}
