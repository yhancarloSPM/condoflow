import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { CacheService } from './cache.service';

@Injectable({
  providedIn: 'root'
})
export class IncidentService {
  private apiUrl = `${environment.apiUrl}/incidents`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cacheService: CacheService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  createIncident(incident: any): Observable<any> {
    this.cacheService.clearByPattern('/incidents/my-incidents');
    return this.http.post(this.apiUrl, incident, { headers: this.getHeaders() });
  }

  createIncidentWithImage(formData: FormData): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    this.cacheService.clearByPattern('/incidents/my-incidents');
    return this.http.post(this.apiUrl, formData, { headers });
  }

  getMyIncidents(): Observable<any> {
    return this.http.get(`${this.apiUrl}/my-incidents`, { headers: this.getHeaders() });
  }

  getAllIncidents(): Observable<any> {
    return this.http.get(this.apiUrl, { headers: this.getHeaders() });
  }

  updateIncidentStatus(id: string, status: string): Observable<any> {
    this.cacheService.clearByPattern('/incidents');
    return this.http.put(`${this.apiUrl}/${id}/status`, { status }, { headers: this.getHeaders() });
  }

  updateIncidentStatusWithComment(id: string, updateData: any): Observable<any> {
    this.cacheService.clearByPattern('/incidents');
    return this.http.put(`${this.apiUrl}/${id}/status`, updateData, { headers: this.getHeaders() });
  }

  cancelIncident(id: string, comment: string): Observable<any> {
    this.cacheService.clearByPattern('/incidents');
    return this.http.put(`${this.apiUrl}/${id}/cancel`, { comment }, { headers: this.getHeaders() });
  }
}