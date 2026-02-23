import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet }                         from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styles:   [`:host { display: block; }`],
})
export class AppComponent {}
