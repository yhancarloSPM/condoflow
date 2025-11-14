import { Injectable } from '@angular/core';
import { AnnouncementTypeFilter } from '../models/announcement.models';

@Injectable({
  providedIn: 'root'
})
export class AnnouncementUtilsService {

  getTypeLabel(type: AnnouncementTypeFilter): string {
    const typeLabels = {
      [AnnouncementTypeFilter.ALL]: 'Todos',
      [AnnouncementTypeFilter.URGENT]: 'Urgentes',
      [AnnouncementTypeFilter.EVENT]: 'Eventos',
      [AnnouncementTypeFilter.INFO]: 'Informativos'
    };
    return typeLabels[type] || type;
  }

  getTypeSeverity(isUrgent: boolean, hasEventDate: boolean): string {
    if (isUrgent) return 'danger';
    if (hasEventDate) return 'warning';
    return 'success';
  }

  getTypeText(isUrgent: boolean, hasEventDate: boolean): string {
    if (isUrgent) return 'URGENTE';
    if (hasEventDate) return 'EVENTO';
    return 'INFORMATIVO';
  }

  formatEventDate(eventDate: string): string {
    const date = new Date(eventDate);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  truncateContent(content: string, maxLength: number = 150): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }
}