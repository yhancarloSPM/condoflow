import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class IncidentService {
  private apiUrl = `${environment.apiUrl}/incidents`;
  
  // Cache
  private incidentsCache$ = new BehaviorSubject<any>(null);
  private lastFetchTime = 0;
  private cacheDuration = 30000; // 30 segundos

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  createIncident(incident: any): Observable<any> {
    return this.http.post(this.apiUrl, incident, { headers: this.getHeaders() }).pipe(
      tap(() => this.clearCache())
    );
  }

  createIncidentWithImage(formData: FormData): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // No agregar Content-Type para FormData
    });
    return this.http.post(this.apiUrl, formData, { headers }).pipe(
      tap(() => this.clearCache())
    );
  }

  getMyIncidents(forceRefresh = false): Observable<any> {
    const now = Date.now();
    const cache = this.incidentsCache$.value;
    
    // Si hay cache válido y no se fuerza refresh, retornar cache
    if (!forceRefresh && cache && (now - this.lastFetchTime) < this.cacheDuration) {
      return of(cache);
    }
    
    // Hacer petición al backend
    return this.http.get(`${this.apiUrl}/my-incidents`, { headers: this.getHeaders() }).pipe(
      tap(response => {
        this.incidentsCache$.next(response);
        this.lastFetchTime = now;
      }),
      shareReplay(1)
    );
  }

  getAllIncidents(): Observable<any> {
    return this.http.get(this.apiUrl, { headers: this.getHeaders() });
  }

  updateIncidentStatus(id: string, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/status`, { status }, { headers: this.getHeaders() }).pipe(
      tap(() => this.clearCache())
    );
  }

  updateIncidentStatusWithComment(id: string, updateData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/status`, updateData, { headers: this.getHeaders() }).pipe(
      tap(() => this.clearCache())
    );
  }

  cancelIncident(id: string, comment: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/cancel`, { comment }, { headers: this.getHeaders() }).pipe(
      tap(() => this.clearCache())
    );
  }
  
  clearCache() {
    this.incidentsCache$.next(null);
    this.lastFetchTime = 0;
  }
}