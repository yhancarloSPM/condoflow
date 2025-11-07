import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CatalogItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  order?: number;
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
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<ApiResponse<CatalogItem[]>> {
    return this.http.get<ApiResponse<CatalogItem[]>>(`${this.apiUrl}/catalogs/categories`);
  }

  getPriorities(): Observable<ApiResponse<CatalogItem[]>> {
    return this.http.get<ApiResponse<CatalogItem[]>>(`${this.apiUrl}/catalogs/priorities`);
  }

  getStatuses(): Observable<ApiResponse<CatalogItem[]>> {
    return this.http.get<ApiResponse<CatalogItem[]>>(`${this.apiUrl}/catalogs/statuses`);
  }

  // Método genérico para obtener cualquier catálogo
  getCatalog(catalogType: string): Observable<ApiResponse<CatalogItem[]>> {
    return this.http.get<ApiResponse<CatalogItem[]>>(`${this.apiUrl}/catalogs/${catalogType}`);
  }
}