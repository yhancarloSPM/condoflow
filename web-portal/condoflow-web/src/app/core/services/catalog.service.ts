import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CatalogItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  order?: number;
  isActive: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private apiUrl = `${environment.apiUrl}/api/catalogs`;

  constructor(private http: HttpClient) {}

  getEventTypes(): Observable<ApiResponse<CatalogItem[]>> {
    return this.http.get<ApiResponse<CatalogItem[]>>(`${environment.apiUrl}/eventtypes`);
  }

  getReservationStatuses(): Observable<ApiResponse<CatalogItem[]>> {
    return this.http.get<ApiResponse<CatalogItem[]>>(`${environment.apiUrl}/statuses/reservation`);
  }

  getIncidentStatuses(): Observable<ApiResponse<CatalogItem[]>> {
    return this.http.get<ApiResponse<CatalogItem[]>>(`${environment.apiUrl}/statuses/incident`);
  }

  getCategories(): Observable<ApiResponse<CatalogItem[]>> {
    return this.http.get<ApiResponse<CatalogItem[]>>(`${environment.apiUrl}/categories`);
  }

  getPriorities(): Observable<ApiResponse<CatalogItem[]>> {
    return this.http.get<ApiResponse<CatalogItem[]>>(`${environment.apiUrl}/priorities`);
  }
}