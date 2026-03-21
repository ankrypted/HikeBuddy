import {
  Component, ViewChild, ElementRef, AfterViewInit, OnDestroy,
  inject, signal, computed, ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink }           from '@angular/router';
import * as L                   from 'leaflet';
import { TrailService }         from '../../core/services/trail/trail.service';
import { GeolocationService }   from '../../core/services/geolocation/geolocation.service';
import { TrailMapPinDto }       from '../../shared/models/trail.dto';

const DIFF_COLOR: Record<string, string> = {
  EASY:     '#7ecb3f',
  MODERATE: '#f59e0b',
  HARD:     '#ef4444',
  EXPERT:   '#a855f7',
};

// India geographic centre as fallback
const INDIA_CENTER: L.LatLngTuple = [22.5937, 78.9629];

@Component({
  selector: 'hb-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './map.component.html',
  styleUrl:    './map.component.scss',
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private readonly trailService = inject(TrailService);
  private readonly geoService   = inject(GeolocationService);

  @ViewChild('mapEl') mapEl!: ElementRef<HTMLDivElement>;

  private map!: L.Map;

  readonly locating     = signal(true);
  readonly userCoords   = signal<{ lat: number; lon: number } | null>(null);
  readonly pins         = signal<TrailMapPinDto[]>([]);

  readonly nearbyPins = computed(() => {
    const user = this.userCoords();
    const list = this.pins();
    if (!user) return list.slice(0, 8);
    return [...list]
      .map(p => ({
        ...p,
        _dist: this.geoService.haversineKm(user.lat, user.lon, p.startLatitude, p.startLongitude),
      }))
      .sort((a, b) => a._dist - b._dist)
      .slice(0, 8);
  });

  readonly legend = [
    { label: 'Easy',     color: DIFF_COLOR['EASY']     },
    { label: 'Moderate', color: DIFF_COLOR['MODERATE']  },
    { label: 'Hard',     color: DIFF_COLOR['HARD']      },
    { label: 'Expert',   color: DIFF_COLOR['EXPERT']    },
  ];

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  locateMe(): void {
    const user = this.userCoords();
    if (user) {
      this.map.setView([user.lat, user.lon], 9, { animate: true });
    }
  }

  private initMap(): void {
    this.map = L.map(this.mapEl.nativeElement, {
      center: INDIA_CENTER,
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(this.map);

    // Plot all trail pins
    this.trailService.getMapPins().subscribe(pins => {
      this.pins.set(pins);
      pins.forEach(pin => this.addTrailMarker(pin));
    });

    // Try geolocation
    this.geoService.getUserPosition().subscribe({
      next: pos => {
        this.userCoords.set(pos);
        this.locating.set(false);
        this.map.setView([pos.lat, pos.lon], 8, { animate: true });

        L.circleMarker([pos.lat, pos.lon], {
          radius:      10,
          fillColor:   '#60a5fa',
          color:       '#fff',
          weight:      3,
          fillOpacity: 1,
        }).addTo(this.map).bindPopup('<b>📍 You are here</b>');
      },
      error: () => this.locating.set(false),
    });
  }

  private addTrailMarker(pin: TrailMapPinDto): void {
    const color = DIFF_COLOR[pin.difficulty] ?? '#7ecb3f';

    L.circleMarker([pin.startLatitude, pin.startLongitude], {
      radius:      7,
      fillColor:   color,
      color:       '#0d1b2a',
      weight:      1.5,
      fillOpacity: 0.88,
    })
      .addTo(this.map)
      .bindPopup(`
        <div class="hb-map-popup">
          <div class="hb-map-popup__name">${pin.name}</div>
          <span class="hb-map-popup__badge hb-map-popup__badge--${pin.difficulty.toLowerCase()}">
            ${pin.difficulty}
          </span>
          <div class="hb-map-popup__meta">${pin.distanceKm} km &nbsp;·&nbsp; ⭐ ${pin.averageRating.toFixed(1)}</div>
          <a class="hb-map-popup__link" href="/trails/${pin.slug}">View Trail →</a>
        </div>
      `, { minWidth: 170 });
  }
}
