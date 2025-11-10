import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CatalogService, CatalogItem } from '../../../core/services/catalog.service';
import { ReservationStatus } from '../models/reservation.models';

@Injectable({
  providedIn: 'root'
})
export class ReservationUtilsService {

  constructor(private catalogService: CatalogService) {}

  getEventTypes(): Observable<CatalogItem[]> {
    return this.catalogService.getEventTypes().pipe(
      map(response => response.data || [])
    );
  }

  getReservationStatuses(): Observable<CatalogItem[]> {
    return this.catalogService.getReservationStatuses().pipe(
      map(response => response.data || [])
    );
  }

  getStatusLabel(status: ReservationStatus): string {
    const statusLabels = {
      [ReservationStatus.PENDING]: 'Pendiente',
      [ReservationStatus.CONFIRMED]: 'Confirmada',
      [ReservationStatus.REJECTED]: 'Rechazada',
      [ReservationStatus.CANCELLED]: 'Cancelada'
    };
    return statusLabels[status] || status;
  }

  getStatusSeverity(status: ReservationStatus): string {
    const severityMap = {
      [ReservationStatus.PENDING]: 'warning',
      [ReservationStatus.CONFIRMED]: 'success',
      [ReservationStatus.REJECTED]: 'danger',
      [ReservationStatus.CANCELLED]: 'secondary'
    };
    return severityMap[status] || 'secondary';
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  getEventTypeName(eventTypeCode: string, eventTypes: CatalogItem[]): string {
    if (!eventTypeCode) return eventTypeCode;
    const eventType = eventTypes.find(et => et.code === eventTypeCode);
    return eventType ? eventType.name : eventTypeCode;
  }
}