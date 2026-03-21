import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface WeatherData {
  temperatureC:   number;
  apparentC:      number;
  humidity:       number;
  windSpeedKph:   number;
  condition:      string;
  icon:           string;   // emoji
  isDay:          boolean;
}

// Open-Meteo WMO weather interpretation codes
function decodeWeatherCode(code: number, isDay: boolean): { condition: string; icon: string } {
  if (code === 0)               return { condition: 'Clear sky',        icon: isDay ? '☀️' : '🌙' };
  if (code === 1)               return { condition: 'Mainly clear',     icon: isDay ? '🌤️' : '🌙' };
  if (code === 2)               return { condition: 'Partly cloudy',    icon: '⛅' };
  if (code === 3)               return { condition: 'Overcast',         icon: '☁️' };
  if (code <= 48)               return { condition: 'Foggy',            icon: '🌫️' };
  if (code <= 55)               return { condition: 'Drizzle',          icon: '🌦️' };
  if (code <= 57)               return { condition: 'Freezing drizzle', icon: '🌧️' };
  if (code <= 65)               return { condition: 'Rain',             icon: '🌧️' };
  if (code <= 67)               return { condition: 'Freezing rain',    icon: '🌧️' };
  if (code <= 75)               return { condition: 'Snow',             icon: '🌨️' };
  if (code === 77)              return { condition: 'Snow grains',      icon: '🌨️' };
  if (code <= 82)               return { condition: 'Rain showers',     icon: '🌦️' };
  if (code <= 86)               return { condition: 'Snow showers',     icon: '🌨️' };
  if (code === 95)              return { condition: 'Thunderstorm',     icon: '⛈️' };
  if (code >= 96)               return { condition: 'Thunderstorm',     icon: '⛈️' };
  return { condition: 'Unknown', icon: '🌡️' };
}

interface OpenMeteoResponse {
  current: {
    temperature_2m:      number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m:      number;
    weather_code:        number;
    is_day:              number;
  };
}

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://api.open-meteo.com/v1/forecast';

  getWeather(lat: number, lon: number): Observable<WeatherData> {
    const params = new HttpParams()
      .set('latitude',  lat)
      .set('longitude', lon)
      .set('current', 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day')
      .set('wind_speed_unit', 'kmh')
      .set('timezone', 'auto');

    return this.http.get<OpenMeteoResponse>(this.apiUrl, { params }).pipe(
      map(res => {
        const c      = res.current;
        const isDay  = c.is_day === 1;
        const { condition, icon } = decodeWeatherCode(c.weather_code, isDay);
        return {
          temperatureC:  Math.round(c.temperature_2m),
          apparentC:     Math.round(c.apparent_temperature),
          humidity:      c.relative_humidity_2m,
          windSpeedKph:  Math.round(c.wind_speed_10m),
          condition,
          icon,
          isDay,
        };
      }),
    );
  }
}
