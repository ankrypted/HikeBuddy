import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { WeatherData } from '../../../core/services/weather/weather.service';

@Component({
  selector: 'hb-weather-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './weather-card.component.html',
  styleUrl: './weather-card.component.scss',
})
export class WeatherCardComponent {
  readonly weather = input.required<WeatherData>();
  readonly loading = input<boolean>(false);
}
