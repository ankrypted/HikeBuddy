import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { AuthService }     from '../auth/auth.service';
import { TrailSummaryDto } from '../../../shared/models/trail.dto';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly authService = inject(AuthService);
  private loadedForId: string | null = null;

  private readonly _favorites = signal<TrailSummaryDto[]>([]);
  readonly favorites = this._favorites.asReadonly();
  readonly count     = computed(() => this._favorites().length);

  constructor() {
    // Re-load from storage whenever the logged-in user changes
    effect(() => {
      const userId = this.authService.currentUser()?.id ?? null;
      if (userId === this.loadedForId) return;
      this.loadedForId = userId;
      this._favorites.set(userId ? this.readStorage(userId) : []);
    }, { allowSignalWrites: true });
  }

  isFavorited(trailId: string): boolean {
    return this._favorites().some(t => t.id === trailId);
  }

  toggleFavorite(trail: TrailSummaryDto): void {
    if (this.isFavorited(trail.id)) {
      this._favorites.update(f => f.filter(t => t.id !== trail.id));
    } else {
      this._favorites.update(f => [...f, trail]);
    }
    this.writeStorage();
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
