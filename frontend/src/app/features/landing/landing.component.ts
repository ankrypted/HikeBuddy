import {
  Component, OnInit, inject, signal, computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router }                    from '@angular/router';
import { TrailService }              from '../../core/services/trail/trail.service';
import { TrailSummaryDto }           from '../../shared/models/trail.dto';
import { SceneBackgroundComponent }  from '../../shared/components/scene-background/scene-background.component';
import { NavbarComponent }           from '../../core/layout/navbar/navbar.component';
import { CtaCardComponent }          from '../../shared/components/cta-card/cta-card.component';
import { TrailCardComponent }        from '../../shared/components/trail-card/trail-card.component';

@Component({
  selector: 'hb-landing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SceneBackgroundComponent,
    NavbarComponent,
    CtaCardComponent,
    TrailCardComponent,
  ],
  templateUrl: './landing.component.html',
  styleUrl:    './landing.component.scss',
})
export class LandingComponent implements OnInit {
  private readonly trailService = inject(TrailService);
  private readonly router       = inject(Router);

  readonly featuredTrails = signal<TrailSummaryDto[]>([]);
  readonly loading        = signal(true);
  readonly error          = signal<string | null>(null);

  readonly middleIndex = computed(() =>
    Math.floor(this.featuredTrails().length / 2),
  );

  ngOnInit(): void {
    this.trailService.getFeaturedTrails().subscribe({
      next:  trails => { this.featuredTrails.set(trails); this.loading.set(false); },
      error: err    => { this.error.set(err.message);     this.loading.set(false); },
    });
  }

  onViewTrail(trail: TrailSummaryDto): void {
    this.router.navigate(['/trails', trail.slug]);
  }
}
