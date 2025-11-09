import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ReservationService } from '../../core/services/reservation.service';
import { NotificationService } from '../../core/services/notification.service';
import { CatalogService, CatalogItem } from '../../core/services/catalog.service';
import { ReservationStatus } from '../../shared/enums/reservation-status.enum';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservations.component.html',
  styleUrls: ['./reservations.component.scss']

})
export class ReservationsComponent implements OnInit {
  selectedDateStr: string = '';
  startTime: string = '';
  endTime: string = '';
  selectedEventType: string = '';
  notes: string = '';
  minDateStr = new Date().toISOString().split('T')[0];
  loading = signal(false);
  reservations = signal<any[]>([]);
  currentPage = signal(1);
  pageSize = 8;
  
  paginatedReservations = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.reservations().slice(start, end);
  });
  
  totalPages = computed(() => Math.ceil(this.reservations().length / this.pageSize));
  currentUser = signal<any>(null);
  
  statusCounts = computed(() => {
    const reservations = this.reservations();
    return {
      pending: reservations.filter(r => r.status === 'Pending').length,
      confirmed: reservations.filter(r => r.status === 'Confirmed').length,
      cancelled: reservations.filter(r => r.status === 'Cancelled').length,
      rejected: reservations.filter(r => r.status === 'Rejected').length
    };
  });
  
  // Catálogos dinámicos
  eventTypes = signal<CatalogItem[]>([]);
  reservationStatuses = signal<CatalogItem[]>([]);

  constructor(
    private reservationService: ReservationService,
    private router: Router,
    private authService: AuthService,
    public notificationService: NotificationService,
    private catalogService: CatalogService
  ) {}

  async ngOnInit() {
    this.currentUser.set(this.authService.user());
    this.loadCatalogs();
    this.loadReservations();
    await this.notificationService.startConnection();
  }

  private loadCatalogs() {
    // Cargar tipos de evento
    this.catalogService.getEventTypes().subscribe({
      next: (response) => {
        this.eventTypes.set(response.data || []);
      },
      error: (error) => console.error('Error loading event types:', error)
    });

    // Cargar estados de reserva
    this.catalogService.getReservationStatuses().subscribe({
      next: (response) => {
        const reservationStatuses = (response.data || []).filter(status => 
          Object.values(ReservationStatus).includes(status.code as ReservationStatus)
        );
        this.reservationStatuses.set(reservationStatuses);
      },
      error: (error) => console.error('Error loading reservation statuses:', error)
    });
  }

  loadReservations() {
    this.reservationService.getMyReservations().subscribe({
      next: (response) => {
        if (response.success) {
          const sorted = (response.data || []).sort((a: any, b: any) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          this.reservations.set(sorted);
        }
      },
      error: (error) => {
        console.error('Error cargando reservas:', error);
        this.reservations.set([]);
      }
    });
  }

  createReservation() {
    if (!this.selectedDateStr || !this.startTime || !this.endTime || !this.selectedEventType) return;
    

    
    this.loading.set(true);
    
    // Validar que no sean la misma hora
    if (this.startTime === this.endTime) {
      this.showErrorMessage('La hora de inicio debe ser diferente a la hora de fin');
      this.loading.set(false);
      return;
    }
    
    const reservation = {
      reservationDate: this.selectedDateStr,
      startTime: this.startTime + ':00',
      endTime: this.endTime + ':00',
      eventTypeCode: this.selectedEventType,
      notes: this.notes
    };
    
    console.log('=== RESERVATION DATA BEING SENT ===');
    console.log('Reservation object:', reservation);
    console.log('Selected event type:', this.selectedEventType);
    console.log('Available event types:', this.eventTypes());
    console.log('====================================');
    
    this.reservationService.createReservation(reservation).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccessMessage('Reserva creada exitosamente. Pendiente de aprobación.');
          this.loadReservations();
          this.resetForm();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error creando reserva:', error);
        const errorMessage = error.error?.message || 'Error al crear la reserva';
        this.showErrorMessage(errorMessage);
        this.loading.set(false);
      }
    });
  }

  showCancelModal = signal(false);
  reservationToCancel = signal<any>(null);
  cancellationReason = signal('');

  openCancelModal(id: string) {
    const reservation = this.reservations().find(r => r.id === id);
    this.reservationToCancel.set(reservation);
    this.cancellationReason.set('');
    this.showCancelModal.set(true);
  }

  cancelReservation() {
    const reservation = this.reservationToCancel();
    if (!reservation) return;
    
    const reason = this.cancellationReason().trim();
    
    if (!reason || reason.length < 10) {
      this.showErrorMessage('El motivo debe tener al menos 10 caracteres');
      return;
    }
    
    this.reservationService.cancelReservation(reservation.id, reason).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccessMessage('Reserva cancelada exitosamente');
          this.loadReservations();
        }
        this.showCancelModal.set(false);
      },
      error: (error) => {
        console.error('Error cancelando reserva:', error);
        this.showErrorMessage('Error al cancelar la reserva');
        this.showCancelModal.set(false);
      }
    });
  }

  resetForm() {
    this.selectedDateStr = '';
    this.startTime = '';
    this.endTime = '';
    this.selectedEventType = '';
    this.notes = '';
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      [ReservationStatus.PENDING]: 'Pendiente',
      [ReservationStatus.CONFIRMED]: 'Confirmada',
      [ReservationStatus.CANCELLED]: 'Cancelada',
      [ReservationStatus.REJECTED]: 'Rechazada'
    };
    return statusMap[status] || status;
  }

  getStatusSeverity(status: string): string {
    const severityMap: { [key: string]: string } = {
      [ReservationStatus.PENDING]: 'warning',
      [ReservationStatus.CONFIRMED]: 'success',
      [ReservationStatus.CANCELLED]: 'secondary',
      [ReservationStatus.REJECTED]: 'danger'
    };
    return severityMap[status] || 'secondary';
  }

  getEventTypeName(eventTypeCode: string): string {
    if (!eventTypeCode) return 'No especificado';
    const eventType = this.eventTypes().find(et => et.code === eventTypeCode);
    return eventType ? eventType.name : 'No especificado';
  }

  navigateToHome(): void {
    this.router.navigate(['/welcome']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'U';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  showSuccessMessage(message: string) {
    const toast = document.createElement('div');
    toast.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; background: #10B981; color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; font-weight: 500;">
        <i class="pi pi-check-circle" style="margin-right: 0.5rem;"></i>
        ${message}
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
  }

  showErrorMessage(message: string) {
    const toast = document.createElement('div');
    toast.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; background: #EF4444; color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; font-weight: 500;">
        <i class="pi pi-times-circle" style="margin-right: 0.5rem;"></i>
        ${message}
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
  }
  
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }
  
  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.totalPages();
    const current = this.currentPage();
    
    if (total <= 5) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (current > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== total) {
          pages.push(i);
        }
      }
      
      if (current < total - 2) {
        pages.push('...');
      }
      
      pages.push(total);
    }
    
    return pages;
  }
  
  Math = Math;

  isOwner(): boolean {
    const user = this.currentUser();
    return user?.role === 'Owner';
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.notificationService.markAsRead(notificationId);
  }

  timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}