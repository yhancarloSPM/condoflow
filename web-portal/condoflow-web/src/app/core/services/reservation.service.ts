import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = `${environment.apiUrl}/reservations`;

  constructor(private http: HttpClient) {}

  getMyReservations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/my-reservations`);
  }

  createReservation(reservation: any): Observable<any> {
    return this.http.post(this.apiUrl, reservation);
  }

  cancelReservation(id: string, reason?: string): Observable<any> {
    const body = reason ? { reason } : {};
    return this.http.request('delete', `${this.apiUrl}/${id}`, { body });
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
    return this.http.put(`${this.apiUrl}/${id}/status`, body);
  }
}