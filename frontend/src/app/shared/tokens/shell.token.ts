import { InjectionToken } from '@angular/core';

/** True when the component is rendered inside the dashboard shell (navbar already provided). */
export const INSIDE_SHELL = new InjectionToken<boolean>('INSIDE_SHELL', {
  factory: () => false,
});
