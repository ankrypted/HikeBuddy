import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService }       from '../auth/auth.service';
import { TrailSummaryDto }   from '../../../shared/models/trail.dto';
import { environment }       from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CompletedTrailsService {
  private readonly authService = inject(AuthService);
  private readonly http        = inject(HttpClient);
  private loadedForId: string | null = null;

  private readonly _completedIds    = signal<ReadonlySet<string>>(new Set());
  private readonly _completedTrails = signal<TrailSummaryDto[]>([]);
  private readonly _pendingReview   = signal<TrailSummaryDto | null>(null);

  readonly completedTrails    = this._completedTrails.asReadonly();
  readonly count              = computed(() => this._completedIds().size);
  readonly pendingReviewTrail = this._pendingReview.asReadonly();

  constructor() {
    effect(() => {
      const userId = this.authService.currentUser()?.id ?? null;
      if (userId === this.loadedForId) return;
      this.loadedForId = userId;

      if (!userId) {
        this._completedIds.set(new Set());
        this._completedTrails.set([]);
        this._pendingReview.set(null);
        return;
      }

      this.http.get<string[]>(`${environment.apiUrl}/users/me/completed-trails`).subscribe({
        next: ids => {
          this._completedIds.set(new Set(ids));
          const cached  = this.readStorage(userId);
          const matched = ids
            .map(id => cached.find(t => t.id === id))
            .filter((t): t is TrailSummaryDto => t != null);
          this._completedTrails.set(matched);
        },
        error: () => {
          const cached = this.readStorage(userId);
          this._completedIds.set(new Set(cached.map(t => t.id)));
          this._completedTrails.set(cached);
        },
      });
    }, { allowSignalWrites: true });
  }

  isCompleted(trailId: string): boolean {
    return this._completedIds().has(trailId);
  }

  markComplete(trail: TrailSummaryDto): void {
    if (this.isCompleted(trail.id)) return;
    // Optimistic update
    this._completedIds.update(s => new Set([...s, trail.id]));
    this._completedTrails.update(f => [trail, ...f]);
    this.writeStorage();

    this.http.post(`${environment.apiUrl}/users/me/completed-trails`, { trailId: trail.id })
      .subscribe({
        next: () => this._pendingReview.set(trail),
        error: () => {
          this._completedIds.update(s => { const n = new Set(s); n.delete(trail.id); return n; });
          this._completedTrails.update(f => f.filter(t => t.id !== trail.id));
          this.writeStorage();
        },
      });
  }

  unmarkComplete(trailId: string): void {
    const trail = this._completedTrails().find(t => t.id === trailId);
    // Optimistic update
    this._completedIds.update(s => { const n = new Set(s); n.delete(trailId); return n; });
    this._completedTrails.update(f => f.filter(t => t.id !== trailId));
    this.writeStorage();

    this.http.delete(`${environment.apiUrl}/users/me/completed-trails/${trailId}`)
      .subscribe({
        error: () => {
          if (trail) {
            this._completedIds.update(s => new Set([...s, trailId]));
            this._completedTrails.update(f => [trail, ...f]);
            this.writeStorage();
          }
        },
      });
  }

  clearPendingReview(): void {
    this._pendingReview.set(null);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private writeStorage(): void {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return;
    try {
      localStorage.setItem(`hb_done_${userId}`, JSON.stringify(this._completedTrails()));
    } catch { /* storage quota exceeded */ }
  }

  private readStorage(userId: string): TrailSummaryDto[] {
    try {
      const raw = localStorage.getItem(`hb_done_${userId}`);
      return raw ? (JSON.parse(raw) as TrailSummaryDto[]) : [];
    } catch {
      return [];
    }
  }
}
