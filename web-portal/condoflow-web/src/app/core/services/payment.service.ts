import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/owners`;
  private conceptsUrl = `${environment.apiUrl}/payment-concepts`;
  
  // Cache
  private paymentsCache$ = new BehaviorSubject<{ [ownerId: string]: any }>({});
  private lastFetchTime: { [ownerId: string]: number } = {};
  private cacheDuration = 30000; // 30 segundos

  constructor(private http: HttpClient) {}

  createPayment(ownerId: string, paymentData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/${ownerId.toLowerCase()}/payments`, paymentData).pipe(
      tap(() => this.clearCache(ownerId))
    );
  }

  getPayments(ownerId: string, forceRefresh = false): Observable<any> {
    const now = Date.now();
    const lastFetch = this.lastFetchTime[ownerId] || 0;
    const cache = this.paymentsCache$.value[ownerId];
    
    // Si hay cache válido y no se fuerza refresh, retornar cache
    if (!forceRefresh && cache && (now - lastFetch) < this.cacheDuration) {
      return of(cache);
    }
    
    // Hacer petición al backend
    return this.http.get(`${this.apiUrl}/${ownerId.toLowerCase()}/payments`).pipe(
      tap(response => {
        const currentCache = this.paymentsCache$.value;
        currentCache[ownerId] = response;
        this.paymentsCache$.next(currentCache);
        this.lastFetchTime[ownerId] = now;
      }),
      shareReplay(1)
    );
  }

  getPaymentConcepts(): Observable<any> {
    return this.http.get(this.conceptsUrl);
  }
  
  clearCache(ownerId: string) {
    const currentCache = this.paymentsCache$.value;
    delete currentCache[ownerId];
    delete this.lastFetchTime[ownerId];
    this.paymentsCache$.next(currentCache);
  }
}