import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ComposeService {
  readonly openRequest = signal(0);
  requestOpen(): void { this.openRequest.update(n => n + 1); }
}
