import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap, map } from 'rxjs';
import { AuthService }     from '../auth/auth.service';
import { TrailService }    from '../trail/trail.service';
import { TrailSummaryDto } from '../../../shared/models/trail.dto';
import { environment }     from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly authService  = inject(AuthService);
  private readonly http         = inject(HttpClient);
  private readonly trailService = inject(TrailService);
  private loadedForId: string | null = null;

  // Source of truth: trail IDs from the backend (enables fast isFavorited checks)
  private readonly _savedIds  = signal<ReadonlySet<string>>(new Set());
  // Full objects: rebuilt from localStorage cache on each login (for display)
  private readonly _favorites = signal<TrailSummaryDto[]>([]);

  readonly favorites = this._favorites.asReadonly();
  readonly count     = computed(() => this._savedIds().size);

  constructor() {
    // Re-sync whenever the logged-in user changes
    effect(() => {
      const userId = this.authService.currentUser()?.id ?? null;
      if (userId === this.loadedForId) return;
      this.loadedForId = userId;

      if (!userId) {
        this._savedIds.set(new Set());
        this._favorites.set([]);
        return;
      }

      this.http.get<string[]>(`${environment.apiUrl}/users/me/saved-trails`).pipe(
        switchMap(ids =>
          this.trailService.getAllTrails().pipe(
            map(allTrails => ({ ids, allTrails })),
          ),
        ),
      ).subscribe({
        next: ({ ids, allTrails }) => {
          this._savedIds.set(new Set(ids));
          // Prefer localStorage cache; fall back to the full trail catalog for
          // IDs that are in the backend but were never written to this browser's cache
          // (e.g. saved on a different device or after a cache clear).
          const cached  = this.readStorage(userId!);
          const matched = ids
            .map(id => cached.find(t => t.id === id) ?? allTrails.find(t => t.id === id))
            .filter((t): t is TrailSummaryDto => t != null);
          this._favorites.set(matched);
          this.writeStorage(); // keep cache up-to-date for next load
        },
        error: () => {
          // Offline / backend unreachable — fall back entirely to localStorage
          const cached = this.readStorage(userId!);
          this._savedIds.set(new Set(cached.map(t => t.id)));
          this._favorites.set(cached);
        },
      });
    }, { allowSignalWrites: true });
  }

  isFavorited(trailId: string): boolean {
    return this._savedIds().has(trailId);
  }

  toggleFavorite(trail: TrailSummaryDto): void {
    if (this.isFavorited(trail.id)) {
      this.remove(trail);
    } else {
      this.add(trail);
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private add(trail: TrailSummaryDto): void {
    // Optimistic update
    this._savedIds.update(s => new Set([...s, trail.id]));
    this._favorites.update(f => [...f, trail]);
    this.writeStorage();

    this.http.post(`${environment.apiUrl}/users/me/saved-trails`, { trailId: trail.id })
      .subscribe({
        error: () => {
          // Revert
          this._savedIds.update(s => { const n = new Set(s); n.delete(trail.id); return n; });
          this._favorites.update(f => f.filter(t => t.id !== trail.id));
          this.writeStorage();
        },
      });
  }

  private remove(trail: TrailSummaryDto): void {
    // Optimistic update
    this._savedIds.update(s => { const n = new Set(s); n.delete(trail.id); return n; });
    this._favorites.update(f => f.filter(t => t.id !== trail.id));
    this.writeStorage();

    this.http.delete(`${environment.apiUrl}/users/me/saved-trails/${trail.id}`)
      .subscribe({
        error: () => {
          // Revert
          this._savedIds.update(s => new Set([...s, trail.id]));
          this._favorites.update(f => [...f, trail]);
          this.writeStorage();
        },
      });
  }

  private writeStorage(): void {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return;
    try {
      localStorage.setItem(`hb_fav_${userId}`, JSON.stringify(this._favorites()));
    } catch { /* storage quota exceeded */ }
  }

  private readStorage(userId: string): TrailSummaryDto[] {
    try {
      const raw = localStorage.getItem(`hb_fav_${userId}`);
      return raw ? (JSON.parse(raw) as TrailSummaryDto[]) : [];
    } catch {
      return [];
    }
  }
}
