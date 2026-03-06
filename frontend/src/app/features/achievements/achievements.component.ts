import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal }              from '@angular/core/rxjs-interop';
import { CompletedTrailsService } from '../../core/services/completed-trails/completed-trails.service';
import { TrailService }          from '../../core/services/trail/trail.service';

interface BadgeState {
  id:          string;
  icon:        string;
  name:        string;
  description: string;
  category:    'milestones' | 'difficulty' | 'distance' | 'community';
  earned:      boolean;
  progress:    number;   // current value (capped at total)
  total:       number;   // target value
  unit:        string;   // displayed after progress/total
}

interface BadgeCategory {
  key:    string;
  icon:   string;
  label:  string;
  badges: BadgeState[];
}

@Component({
  selector:        'hb-achievements',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:     './achievements.component.html',
  styleUrl:        './achievements.component.scss',
})
export class AchievementsComponent {
  private readonly completedService = inject(CompletedTrailsService);
  private readonly trailService     = inject(TrailService);

  private readonly reviews = toSignal(this.trailService.getMyReviews(), { initialValue: [] });

  readonly badges = computed<BadgeState[]>(() => {
    const trails    = this.completedService.completedTrails();
    const reviews   = this.reviews();
    const count     = trails.length;
    const totalKm   = Math.round(trails.reduce((s, t) => s + t.distanceKm, 0));
    const totalElev = Math.round(trails.reduce((s, t) => s + t.elevationGainM, 0));
    const easy      = trails.filter(t => t.difficulty === 'EASY').length;
    const hard      = trails.filter(t => t.difficulty === 'HARD').length;
    const expert    = trails.filter(t => t.difficulty === 'EXPERT').length;
    const regions   = new Set(trails.map(t => t.region.name)).size;
    const revCount  = reviews.length;

    const milestone = (n: number): BadgeState['progress'] => Math.min(count, n);

    return [
      // ── Trail milestones ──────────────────────────────────────────────────
      {
        id: 'first-steps', icon: '🥾', name: 'First Steps',
        description: 'Complete your first trail',
        category: 'milestones', unit: 'trail',
        earned: count >= 1, progress: milestone(1), total: 1,
      },
      {
        id: 'explorer', icon: '🗺️', name: 'Explorer',
        description: 'Complete 5 trails',
        category: 'milestones', unit: 'trails',
        earned: count >= 5, progress: milestone(5), total: 5,
      },
      {
        id: 'adventurer', icon: '⛰️', name: 'Adventurer',
        description: 'Complete 10 trails',
        category: 'milestones', unit: 'trails',
        earned: count >= 10, progress: milestone(10), total: 10,
      },
      {
        id: 'trailblazer', icon: '🏕️', name: 'Trailblazer',
        description: 'Complete 25 trails',
        category: 'milestones', unit: 'trails',
        earned: count >= 25, progress: milestone(25), total: 25,
      },
      {
        id: 'legend', icon: '🏆', name: 'Legend',
        description: 'Complete 50 trails',
        category: 'milestones', unit: 'trails',
        earned: count >= 50, progress: milestone(50), total: 50,
      },

      // ── Difficulty ────────────────────────────────────────────────────────
      {
        id: 'easy-rider', icon: '🌿', name: 'Easy Rider',
        description: 'Complete 3 Easy trails',
        category: 'difficulty', unit: 'trails',
        earned: easy >= 3, progress: Math.min(easy, 3), total: 3,
      },
      {
        id: 'hardcore', icon: '🔥', name: 'Hardcore',
        description: 'Complete 3 Hard trails',
        category: 'difficulty', unit: 'trails',
        earned: hard >= 3, progress: Math.min(hard, 3), total: 3,
      },
      {
        id: 'summit-seeker', icon: '🏔️', name: 'Summit Seeker',
        description: 'Complete an Expert-rated trail',
        category: 'difficulty', unit: 'trail',
        earned: expert >= 1, progress: Math.min(expert, 1), total: 1,
      },

      // ── Distance & exploration ────────────────────────────────────────────
      {
        id: 'hundred-km', icon: '📍', name: '100 km Club',
        description: 'Accumulate 100 km hiked',
        category: 'distance', unit: 'km',
        earned: totalKm >= 100, progress: Math.min(totalKm, 100), total: 100,
      },
      {
        id: 'sky-walker', icon: '☁️', name: 'Sky Walker',
        description: '10,000 m total elevation gain',
        category: 'distance', unit: 'm',
        earned: totalElev >= 10000, progress: Math.min(totalElev, 10000), total: 10000,
      },
      {
        id: 'region-hopper', icon: '🧭', name: 'Region Hopper',
        description: 'Hike in 3 different regions',
        category: 'distance', unit: 'regions',
        earned: regions >= 3, progress: Math.min(regions, 3), total: 3,
      },
      {
        id: 'india-explorer', icon: '🇮🇳', name: 'India Explorer',
        description: 'Hike in 5 different regions',
        category: 'distance', unit: 'regions',
        earned: regions >= 5, progress: Math.min(regions, 5), total: 5,
      },

      // ── Community ─────────────────────────────────────────────────────────
      {
        id: 'storyteller', icon: '✍️', name: 'Storyteller',
        description: 'Leave your first review',
        category: 'community', unit: 'review',
        earned: revCount >= 1, progress: Math.min(revCount, 1), total: 1,
      },
      {
        id: 'trail-voice', icon: '📢', name: 'Trail Voice',
        description: 'Leave 5 reviews',
        category: 'community', unit: 'reviews',
        earned: revCount >= 5, progress: Math.min(revCount, 5), total: 5,
      },
    ];
  });

  readonly earnedCount = computed(() => this.badges().filter(b => b.earned).length);

  readonly categories = computed<BadgeCategory[]>(() => {
    const all = this.badges();
    return [
      { key: 'milestones', icon: '🥾', label: 'Trail Milestones',      badges: all.filter(b => b.category === 'milestones') },
      { key: 'difficulty', icon: '⛰️', label: 'Difficulty',            badges: all.filter(b => b.category === 'difficulty') },
      { key: 'distance',   icon: '📍', label: 'Distance & Exploration', badges: all.filter(b => b.category === 'distance')   },
      { key: 'community',  icon: '✍️', label: 'Community',             badges: all.filter(b => b.category === 'community')  },
    ];
  });

  progressPercent(badge: BadgeState): number {
    return Math.round((badge.progress / badge.total) * 100);
  }

  formatProgress(badge: BadgeState): string {
    return `${badge.progress.toLocaleString()} / ${badge.total.toLocaleString()} ${badge.unit}`;
  }

  earnedInCategory(badges: BadgeState[]): number {
    return badges.filter(b => b.earned).length;
  }
}
