import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface WeatherData {
  temperatureC:   number;
  apparentC:      number;
  humidity:       number;
  windSpeedKph:   number;
  condition:      string;
  icon:           string;
  isDay:          boolean;
  forecast:       DayForecast[];
}

export interface DayForecast {
  date:          string;   // e.g. "Mon", "Tue"
  icon:          string;
  condition:     string;
  maxC:          number;
  minC:          number;
  rainChance:    number;
}

// Open-Meteo WMO weather interpretation codes
function decodeWeatherCode(code: number, isDay: boolean): { condition: string; icon: string } {
  if (code === 0)  return { condition: 'Clear sky',        icon: isDay ? '☀️' : '🌙' };
  if (code === 1)  return { condition: 'Mainly clear',     icon: isDay ? '🌤️' : '🌙' };
  if (code === 2)  return { condition: 'Partly cloudy',    icon: '⛅' };
  if (code === 3)  return { condition: 'Overcast',         icon: '☁️' };
  if (code <= 48)  return { condition: 'Foggy',            icon: '🌫️' };
  if (code <= 55)  return { condition: 'Drizzle',          icon: '🌦️' };
  if (code <= 57)  return { condition: 'Freezing drizzle', icon: '🌧️' };
  if (code <= 65)  return { condition: 'Rain',             icon: '🌧️' };
  if (code <= 67)  return { condition: 'Freezing rain',    icon: '🌧️' };
  if (code <= 75)  return { condition: 'Snow',             icon: '🌨️' };
  if (code === 77) return { condition: 'Snow grains',      icon: '🌨️' };
  if (code <= 82)  return { condition: 'Rain showers',     icon: '🌦️' };
  if (code <= 86)  return { condition: 'Snow showers',     icon: '🌨️' };
  if (code >= 95)  return { condition: 'Thunderstorm',     icon: '⛈️' };
  return { condition: 'Unknown', icon: '🌡️' };
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface OpenMeteoResponse {
  current: {
    temperature_2m:       number;
    apparent_temperature:  number;
    relative_humidity_2m:  number;
    wind_speed_10m:        number;
    weather_code:          number;
    is_day:                number;
  };
  daily: {
    time:                          string[];
    weather_code:                  number[];
    temperature_2m_max:            number[];
    temperature_2m_min:            number[];
    precipitation_probability_max: number[];
  };
}

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly http   = inject(HttpClient);
  private readonly apiUrl = 'https://api.open-meteo.com/v1/forecast';

  getWeather(lat: number, lon: number): Observable<WeatherData> {
    const params = new HttpParams()
      .set('latitude',  lat)
      .set('longitude', lon)
      .set('current',   'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day')
      .set('daily',     'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max')
      .set('wind_speed_unit', 'kmh')
      .set('forecast_days',   '7')
      .set('timezone',  'auto');

    return this.http.get<OpenMeteoResponse>(this.apiUrl, { params }).pipe(
      map(res => {
        const c     = res.current;
        const isDay = c.is_day === 1;
        const { condition, icon } = decodeWeatherCode(c.weather_code, isDay);

        const forecast: DayForecast[] = res.daily.time.map((dateStr, i) => {
          const d    = new Date(dateStr);
          const { condition: dc, icon: di } = decodeWeatherCode(res.daily.weather_code[i], true);
          return {
            date:       i === 0 ? 'Today' : DAY_LABELS[d.getDay()],
            icon:       di,
            condition:  dc,
            maxC:       Math.round(res.daily.temperature_2m_max[i]),
            minC:       Math.round(res.daily.temperature_2m_min[i]),
            rainChance: res.daily.precipitation_probability_max[i] ?? 0,
          };
        });

        return {
          temperatureC: Math.round(c.temperature_2m),
          apparentC:    Math.round(c.apparent_temperature),
          humidity:     c.relative_humidity_2m,
          windSpeedKph: Math.round(c.wind_speed_10m),
          condition,
          icon,
          isDay,
          forecast,
        };
      }),
    );
  }
}
