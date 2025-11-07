import { Injectable } from '@angular/core';
import { Observable, map, tap, of } from 'rxjs';
import { IncidentCategoryOption, IncidentPriorityOption, IncidentPriority, IncidentStatus, IncidentCategory } from '../models/incident.models';
import { CatalogService, CatalogItem } from '../../../core/services/catalog.service';

@Injectable({
  providedIn: 'root'
})
export class IncidentUtilsService {
  private categoriesCache: IncidentCategoryOption[] = [];
  private prioritiesCache: IncidentPriorityOption[] = [];
  
  constructor(private catalogService: CatalogService) {}
  
  getCategories(): Observable<IncidentCategoryOption[]> {
    if (this.categoriesCache.length > 0) {
      return of(this.categoriesCache);
    }
    
    return this.catalogService.getCategories().pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data
            .filter(item => item.isActive)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(item => ({
              label: item.name,
              value: item.code as IncidentCategory
            }));
        }
        console.error('Error loading categories from database');
        return [];
      }),
      tap(categories => this.categoriesCache = categories)
    );
  }

  getPriorities(): Observable<IncidentPriorityOption[]> {
    if (this.prioritiesCache.length > 0) {
      return of(this.prioritiesCache);
    }
    
    return this.catalogService.getPriorities().pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data
            .filter(item => item.isActive)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(item => ({
              label: item.name,
              value: item.code as IncidentPriority
            }));
        }
        console.error('Error loading priorities from database');
        return [];
      }),
      tap(priorities => this.prioritiesCache = priorities)
    );
  }
  
  getCategoryLabel(category: IncidentCategory): string {
    const cat = this.categoriesCache.find(c => c.value === category);
    if (cat) return cat.label;
    
    // Fallback si el cache no está disponible
    const fallbackMap: Record<string, string> = {
      'plumbing': 'Plomería',
      'electrical': 'Eléctrico', 
      'maintenance': 'Mantenimiento',
      'security': 'Seguridad',
      'cleaning': 'Limpieza',
      'common_areas': 'Áreas Comunes',
      'other': 'Otros'
    };
    return fallbackMap[category] || category;
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

  getStatusLabel(status: IncidentStatus): string {
    const statusMap: Record<IncidentStatus, string> = {
      [IncidentStatus.REPORTED]: 'Reportada',
      [IncidentStatus.IN_PROGRESS]: 'En Proceso',
      [IncidentStatus.RESOLVED]: 'Resuelta',
      [IncidentStatus.CANCELLED]: 'Cancelada',
      [IncidentStatus.REJECTED]: 'Rechazada'
    };
    return statusMap[status] || status;
  }

  getStatusSeverity(status: IncidentStatus): string {
    const severityMap: Record<IncidentStatus, string> = {
      [IncidentStatus.REPORTED]: 'warning',
      [IncidentStatus.IN_PROGRESS]: 'info',
      [IncidentStatus.RESOLVED]: 'success',
      [IncidentStatus.CANCELLED]: 'secondary',
      [IncidentStatus.REJECTED]: 'danger'
    };
    return severityMap[status] || 'secondary';
  }
}