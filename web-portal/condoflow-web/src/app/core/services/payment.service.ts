import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CacheService } from './cache.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/owners`;
  private conceptsUrl = `${environment.apiUrl}/payment-concepts`;

  constructor(
    private http: HttpClient,
    private cacheService: CacheService
  ) {}

  createPayment(ownerId: string, paymentData: FormData): Observable<any> {
    // Limpiar caché de pagos al crear uno nuevo
    this.cacheService.clearByPattern(`/owners/${ownerId.toLowerCase()}/payments`);
    return this.http.post(`${this.apiUrl}/${ownerId.toLowerCase()}/payments`, paymentData);
  }

  getPayments(ownerId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${ownerId.toLowerCase()}/payments`);
  }

  getPaymentConcepts(): Observable<any> {
    return this.http.get(this.conceptsUrl);
  }
}