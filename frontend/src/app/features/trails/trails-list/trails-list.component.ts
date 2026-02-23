import {
  Component, OnInit, ChangeDetectionStrategy, signal, inject,
} from '@angular/core';
import { Router }                   from '@angular/router';
import { NavbarComponent }          from '../../../core/layout/navbar/navbar.component';
import { SceneBackgroundComponent } from '../../../shared/components/scene-background/scene-background.component';
import { TrailService }             from '../../../core/services/trail/trail.service';
import { TrailSummaryDto }          from '../../../shared/models/trail.dto';

@Component({
  selector: 'hb-trails-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NavbarComponent, SceneBackgroundComponent],
  templateUrl: './trails-list.component.html',
  styleUrl:    './trails-list.component.scss',
})
export class TrailsListComponent implements OnInit {
  private readonly trailService = inject(TrailService);
  private readonly router       = inject(Router);

  readonly trails  = signal<TrailSummaryDto[]>([]);
  readonly loading = signal(true);
  readonly error   = signal(false);

  ngOnInit(): void {
    this.trailService.getFeaturedTrails().subscribe({
      next:  t  => { this.trails.set(t); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }

  navigate(trail: TrailSummaryDto): void {
    this.router.navigate(['/trails', trail.slug]);
  }

  formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }

  stars(rating: number): ('filled' | 'empty')[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating) ? 'filled' : 'empty');
  }
}
