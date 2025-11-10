import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CatalogService, CatalogItem } from '../../../core/services/catalog.service';
import { UserStatus } from '../models/user.models';

@Injectable({
  providedIn: 'root'
})
export class UserUtilsService {

  constructor(private catalogService: CatalogService) {}

  getStatusLabel(status: UserStatus): string {
    const statusLabels = {
      [UserStatus.PENDING]: 'Pendiente',
      [UserStatus.APPROVED]: 'Aprobado',
      [UserStatus.REJECTED]: 'Rechazado'
    };
    return statusLabels[status] || status;
  }

  getStatusSeverity(status: UserStatus): string {
    const severityMap = {
      [UserStatus.PENDING]: 'warning',
      [UserStatus.APPROVED]: 'success',
      [UserStatus.REJECTED]: 'danger'
    };
    return severityMap[status] || 'secondary';
  }
}