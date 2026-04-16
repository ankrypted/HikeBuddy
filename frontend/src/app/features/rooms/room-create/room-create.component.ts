import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { Router, RouterLink }  from '@angular/router';
import { FormsModule }         from '@angular/forms';
import { NavbarComponent }     from '../../../core/layout/navbar/navbar.component';
import { SceneBackgroundComponent } from '../../../shared/components/scene-background/scene-background.component';
import { RoomService }         from '../../../core/services/room/room.service';
import { TrailService }        from '../../../core/services/trail/trail.service';
import { TrailSummaryDto }     from '../../../shared/models/trail.dto';

@Component({
  selector:        'hb-room-create',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [FormsModule, RouterLink, NavbarComponent, SceneBackgroundComponent],
  templateUrl:     './room-create.component.html',
  styleUrl:        './room-create.component.scss',
})
export class RoomCreateComponent implements OnInit {
  private readonly roomService  = inject(RoomService);
  private readonly trailService = inject(TrailService);
  private readonly router       = inject(Router);

  readonly trails    = signal<TrailSummaryDto[]>([]);
  readonly submitting = signal(false);
  readonly error      = signal<string | null>(null);

  trailId      = '';
  trailName    = '';
  plannedDate  = '';
  title        = '';
  durationDays = 1;

  readonly today = new Date().toISOString().split('T')[0];

  ngOnInit(): void {
    this.trailService.getAllTrails().subscribe(t => this.trails.set(t));
  }

  onTrailChange(slug: string): void {
    const trail = this.trails().find(t => t.slug === slug);
    if (trail) {
      this.trailId   = trail.slug;
      this.trailName = trail.name;
    }
  }

  submit(): void {
    if (!this.trailId || !this.plannedDate || !this.title.trim()) return;
    this.submitting.set(true);
    this.error.set(null);

    this.roomService.createRoom({
      trailId:      this.trailId,
      trailName:    this.trailName,
      plannedDate:  this.plannedDate,
      title:        this.title.trim(),
      durationDays: this.durationDays,
    }).subscribe({
      next: room => this.router.navigate(['/rooms', room.id]),
      error: err => {
        this.error.set(err.error?.message ?? 'Failed to create room. Please try again.');
        this.submitting.set(false);
      },
    });
  }
}
