import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NavbarComponent } from '../../core/layout/navbar/navbar.component';

@Component({
  selector: 'hb-gallery',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NavbarComponent],
  template: `
    <hb-navbar />
    <div class="stub-page"><h1>Gallery</h1><p>Coming soon.</p></div>
  `,
  styles: [`.stub-page { padding: 2rem 2.5rem; color: #fff; } h1 { font-size: 2rem; margin-bottom: 0.5rem; }`],
})
export class GalleryComponent {}
