import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError }               from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // TODO: integrate with a toast/snackbar service
      console.error(`[HTTP ${err.status}]`, err.url, err.message);
      return throwError(() => err);
    }),
  );
};
