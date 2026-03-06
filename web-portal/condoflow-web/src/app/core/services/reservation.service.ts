import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = `${environment.apiUrl}/reservations`;
  
  // Cache
  private reservationsCache$ = new BehaviorSubject<any>(null);
  private lastFetchTime = 0;
  private cacheDuration = 30000; // 30 segundos

  constructor(private http: HttpClient) {}

  getMyReservations(forceRefresh = false): Observable<any> {
    const now = Date.now();
    const cache = this.reservationsCache$.value;
    
    // Si hay cache válido y no se fuerza refresh, retornar cache
    if (!forceRefresh && cache && (now - this.lastFetchTime) < this.cacheDuration) {
      return of(cache);
    }
    
    // Hacer petición al backend
    return this.http.get(`${this.apiUrl}/my-reservations`).pipe(
      tap(response => {
        this.reservationsCache$.next(response);
        this.lastFetchTime = now;
      }),
      shareReplay(1)
    );
  }

  createReservation(reservation: any): Observable<any> {
    return this.http.post(this.apiUrl, reservation).pipe(
      tap(() => this.clearCache())
    );
  }

  cancelReservation(id: string, reason?: string): Observable<any> {
    const body = reason ? { reason } : {};
    return this.http.request('delete', `${this.apiUrl}/${id}`, { body }).pipe(
      tap(() => this.clearCache())
    );
  }

  getAvailableSlots(): Observable<any> {
    return this.http.get(`${this.apiUrl}/slots`);
  }

  checkAvailability(date: string, startTime: string, endTime: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/availability?date=${date}&startTime=${startTime}&endTime=${endTime}`);
  }

  getAllReservations(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  updateReservationStatus(id: string, status: string, reason?: string): Observable<any> {
    const body = reason ? { status, reason } : { status };
    return this.http.put(`${this.apiUrl}/${id}/status`, body).pipe(
      tap(() => this.clearCache())
    );
  }
  
  clearCache() {
    this.reservationsCache$.next(null);
    this.lastFetchTime = 0;
  }
}