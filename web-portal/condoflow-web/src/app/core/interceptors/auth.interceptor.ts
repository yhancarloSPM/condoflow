import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  // Agregar token si existe
  const authReq = token ? req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  }) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es 401 y no es una petición de refresh, intentar renovar token
      if (error.status === 401 && !req.url.includes('/auth/refresh-token')) {
        return authService.refreshAuthToken().pipe(
          switchMap((refreshResponse) => {
            if (refreshResponse.success) {
              // Reintentar la petición original con el nuevo token
              const newToken = authService.token();
              const retryReq = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${newToken}`)
              });
              return next(retryReq);
            } else {
              // Si el refresh falla, propagar el error original
              return throwError(() => error);
            }
          })
        );
      }
      
      return throwError(() => error);
    })
  );
};