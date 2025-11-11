import { Injectable } from '@angular/core';
import { PaymentStatus } from '../../../shared/enums/payment-status.enum';

@Injectable({
  providedIn: 'root'
})
export class PaymentUtilsService {

  getStatusText(status: PaymentStatus): string {
    const statusMap: { [key in PaymentStatus]: string } = {
      [PaymentStatus.PENDING]: 'En Revisión',
      [PaymentStatus.APPROVED]: 'Aprobado',
      [PaymentStatus.REJECTED]: 'Rechazado'
    };
    return statusMap[status] || status;
  }

  getStatusSeverity(status: PaymentStatus): string {
    const severityMap: { [key in PaymentStatus]: string } = {
      [PaymentStatus.PENDING]: 'warning',
      [PaymentStatus.APPROVED]: 'success',
      [PaymentStatus.REJECTED]: 'danger'
    };
    return severityMap[status] || 'secondary';
  }

  getStatusIcon(status: PaymentStatus): string {
    const iconMap: { [key in PaymentStatus]: string } = {
      [PaymentStatus.PENDING]: 'pi-clock',
      [PaymentStatus.APPROVED]: 'pi-check',
      [PaymentStatus.REJECTED]: 'pi-times'
    };
    return iconMap[status] || 'pi-circle';
  }

  getStatusBadgeClass(status: PaymentStatus): string {
    const classMap: { [key in PaymentStatus]?: string } = {
      [PaymentStatus.APPROVED]: 'badge bg-success',
      [PaymentStatus.REJECTED]: 'badge bg-danger',
      [PaymentStatus.PENDING]: 'badge bg-warning'
    };
    return classMap[status] || 'badge';
  }
}