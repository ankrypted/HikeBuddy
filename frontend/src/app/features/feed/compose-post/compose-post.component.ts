import {
  Component, Output, EventEmitter, ChangeDetectionStrategy,
  signal, computed, inject, OnInit,
} from '@angular/core';
import { AuthService }       from '../../../core/services/auth/auth.service';
import { TrailService }      from '../../../core/services/trail/trail.service';
import { TrailSummaryDto }   from '../../../shared/models/trail.dto';
import { HikePostDto, TrailCondition, Recommendation } from '../../../shared/models/hike-post.dto';
import { moderateContent }   from '../../../core/utils/content-moderation';

export const CONDITIONS: { value: TrailCondition; label: string; color: string }[] = [
  { value: 'GREAT',   label: 'Great',   color: '#22c55e' },
  { value: 'MUDDY',   label: 'Muddy',   color: '#f59e0b' },
  { value: 'SNOWY',   label: 'Snowy',   color: '#93c5fd' },
  { value: 'CROWDED', label: 'Crowded', color: '#f97316' },
  { value: 'AVOID',   label: 'Avoid',   color: '#ef4444' },
];

export const RECOMMENDATIONS: { value: Recommendation; label: string; color: string }[] = [
  { value: 'YES',   label: 'Yes',   color: '#22c55e' },
  { value: 'MAYBE', label: 'Maybe', color: '#f59e0b' },
  { value: 'NO',    label: 'No',    color: '#ef4444' },
];

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
  readonly conditions    = CONDITIONS;
  readonly recommendations = RECOMMENDATIONS;

  // Form fields
  readonly trailQuery    = signal('');
  readonly allTrails     = signal<TrailSummaryDto[]>([]);
  readonly selectedTrail = signal<TrailSummaryDto | null>(null);
  readonly experience    = signal('');
  readonly condition     = signal<TrailCondition | null>(null);
  readonly recommendation = signal<Recommendation | null>(null);
  readonly tip           = signal('');

  // UI state
  readonly avatarFailed  = signal(false);
  readonly submitting    = signal(false);
  readonly moderationError = signal<string | null>(null);

  readonly filteredTrails = computed(() => {
    if (this.selectedTrail()) return [];
    const q = this.trailQuery().trim().toLowerCase();
    if (!q) return [];
    return this.allTrails().filter(t => t.name.toLowerCase().includes(q)).slice(0, 6);
  });

  readonly canSubmit = computed(() =>
    !!this.selectedTrail() &&
    this.experience().trim().length > 0 &&
    !!this.condition() &&
    !!this.recommendation() &&
    !this.submitting()
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
    this.moderationError.set(null);
  }

  selectTrail(trail: TrailSummaryDto): void {
    this.selectedTrail.set(trail);
    this.trailQuery.set(trail.name);
  }

  clearTrail(): void {
    this.selectedTrail.set(null);
    this.trailQuery.set('');
  }

  setCondition(value: TrailCondition): void {
    this.condition.set(value === this.condition() ? null : value);
  }

  setRecommendation(value: Recommendation): void {
    this.recommendation.set(value === this.recommendation() ? null : value);
  }

  onExperience(event: Event): void {
    this.experience.set((event.target as HTMLTextAreaElement).value);
    this.moderationError.set(null);
  }

  onTip(event: Event): void {
    this.tip.set((event.target as HTMLInputElement).value);
    this.moderationError.set(null);
  }

  initials(username: string | undefined): string {
    if (!username) return '?';
    return username.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || '?';
  }

  submit(): void {
    if (!this.canSubmit()) return;

    // Content moderation check
    const result = moderateContent(this.experience(), this.tip());
    if (!result.clean) {
      this.moderationError.set(result.reason ?? 'Post contains disallowed content.');
      return;
    }

    const user  = this.currentUser();
    const trail = this.selectedTrail()!;
    this.submitting.set(true);

    const post: HikePostDto = {
      id:             'post-' + Date.now(),
      author:         { username: user?.username ?? 'you', avatarUrl: user?.avatarUrl ?? null },
      trailName:      trail.name,
      trailSlug:      trail.slug,
      experience:     this.experience().trim(),
      condition:      this.condition()!,
      recommendation: this.recommendation()!,
      tip:            this.tip().trim() || undefined,
      timestamp:      new Date().toISOString(),
    };

    this.posted.emit(post);
    this.close.emit();
  }
}
