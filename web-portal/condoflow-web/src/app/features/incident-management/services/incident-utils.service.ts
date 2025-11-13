import { Injectable } from '@angular/core';
import { Observable, map, tap, of } from 'rxjs';
import { IncidentCategoryOption, IncidentPriorityOption, IncidentPriority, IncidentStatus, IncidentCategory } from '../models/incident.models';
import { CatalogService, CatalogItem, ApiResponse } from '../../../core/services/catalog.service';

@Injectable({
  providedIn: 'root'
})
export class IncidentUtilsService {
  private categoriesCache: IncidentCategoryOption[] = [];
  private prioritiesCache: IncidentPriorityOption[] = [];
  private statusesCache: any[] = [];
  
  constructor(private catalogService: CatalogService) {}
  
  getCategories(): Observable<IncidentCategoryOption[]> {
    if (this.categoriesCache.length > 0) {
      return of(this.categoriesCache);
    }
    
    return this.catalogService.getCategories().pipe(
      map((response: ApiResponse<CatalogItem[]>) => {
        if (response.success && response.data) {
          return response.data
            .filter((item: CatalogItem) => item.isActive)
            .sort((a: CatalogItem, b: CatalogItem) => a.name.localeCompare(b.name))
            .map((item: CatalogItem) => ({
              label: item.name,
              value: item.code as IncidentCategory
            }));
        }
        console.error('Error loading categories from database');
        return [];
      }),
      tap((categories: IncidentCategoryOption[]) => this.categoriesCache = categories)
    );
  }

  getPriorities(): Observable<IncidentPriorityOption[]> {
    if (this.prioritiesCache.length > 0) {
      return of(this.prioritiesCache);
    }
    
    return this.catalogService.getPriorities().pipe(
      map((response: ApiResponse<CatalogItem[]>) => {
        if (response.success && response.data) {
          return response.data
            .filter((item: CatalogItem) => item.isActive)
            .sort((a: CatalogItem, b: CatalogItem) => a.name.localeCompare(b.name))
            .map((item: CatalogItem) => ({
              label: item.name,
              value: item.code as IncidentPriority
            }));
        }
        console.error('Error loading priorities from database');
        return [];
      }),
      tap((priorities: IncidentPriorityOption[]) => this.prioritiesCache = priorities)
    );
  }

  getStatuses(): Observable<any[]> {
    if (this.statusesCache.length > 0) {
      return of(this.statusesCache);
    }
    
    return this.catalogService.getIncidentStatuses().pipe(
      map((response: ApiResponse<CatalogItem[]>) => {
        if (response.success && response.data) {
          return response.data
            .filter((item: CatalogItem) => item.isActive)
            .map((item: CatalogItem) => ({
              label: item.name,
              value: item.code,
              code: item.code,
              name: item.name
            }));
        }
        console.error('Error loading statuses from database');
        return [];
      }),
      tap((statuses: any[]) => this.statusesCache = statuses)
    );
  }
  
  getCategoryLabel(category: IncidentCategory): string {
    const cat = this.categoriesCache.find(c => c.value === category);
    return cat ? cat.label : category;
  }

  getPriorityLabel(priority: IncidentPriority): string {
    const prio = this.prioritiesCache.find(p => p.value === priority);
    return prio ? prio.label : priority;
  }

  getPrioritySeverity(priority: IncidentPriority): string {
    const severityMap: Record<IncidentPriority, string> = {
      [IncidentPriority.CRITICAL]: 'danger',
      [IncidentPriority.HIGH]: 'warning',
      [IncidentPriority.MEDIUM]: 'success',
      [IncidentPriority.LOW]: 'info'
    };
    return severityMap[priority] || 'secondary';
  }

  getStatusLabel(status: string): string {
    // Mapeo directo para estados conocidos
    const statusMap: Record<string, string> = {
      'reported': 'Reportada',
      'in_progress': 'En Progreso', 
      'resolved': 'Resuelta',
      'cancelled': 'Cancelada',
      'rejected': 'Rechazada'
    };
    
    // Primero intentar el mapeo directo
    if (statusMap[status]) {
      return statusMap[status];
    }
    
    // Si no, buscar en cache
    const statusItem = this.statusesCache.find(s => s.code === status);
    return statusItem ? statusItem.name : status;
  }

  getStatusSeverity(status: string): string {
    const severityMap: Record<string, string> = {
      'reported': 'warning',
      'in_progress': 'info',
      'resolved': 'success', 
      'cancelled': 'secondary',
      'rejected': 'danger',
      'Reported': 'warning',
      'InProgress': 'info',
      'Resolved': 'success',
      'Cancelled': 'secondary', 
      'Rejected': 'danger'
    };
    return severityMap[status] || 'secondary';
  }
}