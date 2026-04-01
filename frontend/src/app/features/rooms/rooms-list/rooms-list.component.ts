import {
  ChangeDetectionStrategy, Component, OnInit, signal, inject, computed,
} from '@angular/core';
import { RouterLink }           from '@angular/router';
import { FormsModule }          from '@angular/forms';
import { NgTemplateOutlet }     from '@angular/common';
import { NavbarComponent }      from '../../../core/layout/navbar/navbar.component';
import { SceneBackgroundComponent } from '../../../shared/components/scene-background/scene-background.component';
import { RoomService }          from '../../../core/services/room/room.service';
import { AuthService }          from '../../../core/services/auth/auth.service';
import { TrailService }         from '../../../core/services/trail/trail.service';
import { RoomSummaryDto }       from '../../../shared/models/room.dto';
import { TrailSummaryDto }      from '../../../shared/models/trail.dto';

type Tab = 'my' | 'open';
type Step = 1 | 2 | 3;

@Component({
  selector:        'hb-rooms-list',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [RouterLink, NavbarComponent, SceneBackgroundComponent, FormsModule, NgTemplateOutlet],
  templateUrl:     './rooms-list.component.html',
  styleUrl:        './rooms-list.component.scss',
})
export class RoomsListComponent implements OnInit {
  private readonly roomService  = inject(RoomService);
  private readonly authService  = inject(AuthService);
  private readonly trailService = inject(TrailService);

  readonly isLoggedIn  = this.authService.isLoggedIn;
  readonly myRooms     = this.roomService.myRooms;
  readonly openRooms   = this.roomService.openRooms;
  readonly loading     = signal(true);

  readonly activeTab   = signal<Tab>('my');
  readonly trailFilter = signal('');

  // ── Upcoming strip: next 5 rooms across all open rooms by date ────────────
  readonly upcomingRooms = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    const all   = [...this.myRooms(), ...this.openRooms()];
    const seen  = new Set<string>();
    return all
      .filter(r => r.plannedDate >= today && r.status === 'OPEN')
      .sort((a, b) => a.plannedDate.localeCompare(b.plannedDate))
      .filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; })
      .slice(0, 6);
  });

  // ── Trail-first: group open rooms by trail ────────────────────────────────
  readonly filteredOpenRooms = computed(() => {
    const q = this.trailFilter().toLowerCase().trim();
    return q
      ? this.openRooms().filter(r =>
          r.trailName.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.creatorUsername.toLowerCase().includes(q))
      : this.openRooms();
  });

  readonly trailGroups = computed(() => {
    const groups = new Map<string, { trailName: string; rooms: RoomSummaryDto[] }>();
    for (const r of this.filteredOpenRooms()) {
      if (!groups.has(r.trailId)) groups.set(r.trailId, { trailName: r.trailName, rooms: [] });
      groups.get(r.trailId)!.rooms.push(r);
    }
    return [...groups.values()];
  });

  // ── Stepper modal ─────────────────────────────────────────────────────────
  readonly stepperOpen = signal(false);
  readonly step        = signal<Step>(1);
  readonly trails      = signal<TrailSummaryDto[]>([]);
  readonly trailSearch = signal('');
  readonly submitting  = signal(false);
  readonly stepError   = signal<string | null>(null);

  selectedTrail: TrailSummaryDto | null = null;
  plannedDate = '';
  roomTitle   = '';
  readonly today = new Date().toISOString().split('T')[0];

  readonly filteredTrails = computed(() => {
    const q = this.trailSearch().toLowerCase().trim();
    return q
      ? this.trails().filter(t => t.name.toLowerCase().includes(q))
      : this.trails().slice(0, 12);
  });

  ngOnInit(): void {
    this.roomService.loadOpenRooms();
    if (this.isLoggedIn()) {
      this.roomService.loadMyRooms();
      this.trailService.getAllTrails().subscribe(t => this.trails.set(t));
    }
    this.loading.set(false);
  }

  // ── Stepper ───────────────────────────────────────────────────────────────
  openStepper(): void {
    if (!this.isLoggedIn()) return;
    this.step.set(1);
    this.stepError.set(null);
    this.selectedTrail = null;
    this.plannedDate   = '';
    this.roomTitle     = '';
    this.trailSearch.set('');
    this.stepperOpen.set(true);
  }

  closeStepper(): void { this.stepperOpen.set(false); }

  selectTrail(t: TrailSummaryDto): void {
    this.selectedTrail = t;
    this.roomTitle = `${t.name} — Group Hike`;
    this.step.set(2);
  }

  goBack(): void {
    const s = this.step();
    if (s > 1) this.step.set((s - 1) as Step);
  }

  nextToConfirm(): void {
    if (!this.plannedDate || !this.roomTitle.trim()) {
      this.stepError.set('Please fill in all fields.');
      return;
    }
    this.stepError.set(null);
    this.step.set(3);
  }

  createRoom(): void {
    if (!this.selectedTrail) return;
    this.submitting.set(true);
    this.roomService.createRoom({
      trailId:     this.selectedTrail.slug,
      trailName:   this.selectedTrail.name,
      plannedDate: this.plannedDate,
      title:       this.roomTitle.trim(),
    }).subscribe({
      next: () => {
        this.closeStepper();
        this.activeTab.set('my');
      },
      error: err => {
        this.stepError.set(err.error?.message ?? 'Failed to create room.');
        this.submitting.set(false);
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  countdown(iso: string): string {
    const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
    if (days === 0) return 'Today!';
    if (days === 1) return 'Tomorrow';
    if (days < 0)  return 'Past';
    return `${days}d away`;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  initials(username: string): string {
    return username.slice(0, 2).toUpperCase();
  }
}
