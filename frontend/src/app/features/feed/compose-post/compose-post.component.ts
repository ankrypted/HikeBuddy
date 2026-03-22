import {
  Component, Output, EventEmitter, ChangeDetectionStrategy,
  signal, computed, inject, OnInit,
} from '@angular/core';
import { RouterLink }       from '@angular/router';
import { AuthService }      from '../../../core/services/auth/auth.service';
import { TrailService }     from '../../../core/services/trail/trail.service';
import { TrailSummaryDto }  from '../../../shared/models/trail.dto';
import { HikePostDto, TrailCondition } from '../../../shared/models/hike-post.dto';

export const CONDITION_OPTIONS: {
  value: TrailCondition;
  label: string;
  color: string;
}[] = [
  { value: 'GREAT',   label: 'Great',   color: '#22c55e' },
  { value: 'MUDDY',   label: 'Muddy',   color: '#f59e0b' },
  { value: 'SNOWY',   label: 'Snowy',   color: '#93c5fd' },
  { value: 'CROWDED', label: 'Crowded', color: '#f97316' },
  { value: 'AVOID',   label: 'Avoid',   color: '#ef4444' },
];

@Component({
  selector:        'hb-compose-post',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [RouterLink],
  templateUrl:     './compose-post.component.html',
  styleUrl:        './compose-post.component.scss',
})
export class ComposePostComponent implements OnInit {
  private readonly authService  = inject(AuthService);
  private readonly trailService = inject(TrailService);

  @Output() close  = new EventEmitter<void>();
  @Output() posted = new EventEmitter<HikePostDto>();

  readonly currentUser = this.authService.currentUser;

  readonly conditions    = CONDITION_OPTIONS;
  readonly trailQuery    = signal('');
  readonly allTrails     = signal<TrailSummaryDto[]>([]);
  readonly selectedTrail = signal<TrailSummaryDto | null>(null);
  readonly dropdownOpen  = signal(false);
  readonly condition     = signal<TrailCondition | null>(null);
  readonly caption       = signal('');
  readonly submitting    = signal(false);
  readonly avatarFailed  = signal(false);

  readonly filteredTrails = computed(() => {
    if (this.selectedTrail()) return [];
    const q = this.trailQuery().trim().toLowerCase();
    if (!q) return [];
    return this.allTrails()
      .filter(t => t.name.toLowerCase().includes(q))
      .slice(0, 6);
  });

  readonly canSubmit = computed(() =>
    !!this.selectedTrail() && !!this.condition() && !this.submitting()
  );

  ngOnInit(): void {
    this.trailService.getAllTrails().subscribe(ts => this.allTrails.set(ts));
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('compose-overlay')) {
      this.close.emit();
    }
  }

  onSearch(event: Event): void {
    this.trailQuery.set((event.target as HTMLInputElement).value);
    this.selectedTrail.set(null);
    this.dropdownOpen.set(true);
  }

  selectTrail(trail: TrailSummaryDto): void {
    this.selectedTrail.set(trail);
    this.trailQuery.set(trail.name);
    this.dropdownOpen.set(false);
  }

  clearTrail(): void {
    this.selectedTrail.set(null);
    this.trailQuery.set('');
  }

  setCondition(value: TrailCondition): void {
    this.condition.set(value === this.condition() ? null : value);
  }

  onCaption(event: Event): void {
    this.caption.set((event.target as HTMLTextAreaElement).value);
  }

  initials(username: string | undefined): string {
    if (!username) return '?';
    return username.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || '?';
  }

  submit(): void {
    const trail = this.selectedTrail();
    const cond  = this.condition();
    if (!trail || !cond || this.submitting()) return;

    const user = this.currentUser();
    this.submitting.set(true);

    const post: HikePostDto = {
      id:        'post-' + Date.now(),
      author:    { username: user?.username ?? 'you', avatarUrl: user?.avatarUrl ?? null },
      trailName: trail.name,
      trailSlug: trail.slug,
      condition: cond,
      caption:   this.caption().trim(),
      timestamp: new Date().toISOString(),
    };

    this.posted.emit(post);
    this.close.emit();
  }
}
