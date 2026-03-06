import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, tap } from 'rxjs';
import { CacheService } from '../services/cache.service';

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  const cacheService = inject(CacheService);

  // Solo cachear peticiones GET
  if (req.method !== 'GET') {
    return next(req);
  }

  // No cachear si tiene header 'X-No-Cache'
  if (req.headers.has('X-No-Cache')) {
    return next(req);
  }

  // Intentar obtener del caché
  const cachedResponse = cacheService.get(req.urlWithParams);
  
  if (cachedResponse) {
    // Retornar respuesta cacheada
    return of(new HttpResponse({
      body: cachedResponse,
      status: 200,
      statusText: 'OK (from cache)'
    }));
  }

  // Si no hay caché, hacer la petición y guardar en caché
  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        cacheService.set(req.urlWithParams, event.body);
      }
    })
  );
};
