import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ReservationService } from '../../core/services/reservation.service';
import { NotificationService } from '../../core/services/notification.service';
import { CatalogService, CatalogItem } from '../../core/services/catalog.service';
import { ReservationStatus } from '../../shared/enums/reservation-status.enum';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, PaginationComponent],
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
  pageSize = environment.pagination.defaultPageSize;
  eventTypeFilter = '';
  statusFilter = '';
  dateFromFilter = '';
  dateToFilter = '';
  allReservations: any[] = [];
  filteredReservations = signal<any[]>([]);
  
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
  
  private addTestData() {
    if (this.allReservations.length === 0) {
      const testReservations = [
        {
          id: '1',
          reservationDate: '2024-01-15',
          startTime: '14:00:00',
          endTime: '18:00:00',
          eventTypeCode: 'birthday',
          notes: 'Cumpleaños de mi hijo',
          status: 'Confirmed',
          createdAt: '2024-01-10'
        },
        {
          id: '2',
          reservationDate: '2024-01-20',
          startTime: '10:00:00',
          endTime: '14:00:00',
          eventTypeCode: 'meeting',
          notes: 'Reunión familiar',
          status: 'Pending',
          createdAt: '2024-01-12'
        }
      ];
      this.allReservations = testReservations;
      this.applyFilters();
    }
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
    this.loading.set(true);
    this.reservationService.getMyReservations().subscribe({
      next: (response) => {
        if (response.success) {
          const sorted = (response.data || []).sort((a: any, b: any) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          this.allReservations = sorted;
          this.applyFilters();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando reservas:', error);
        this.allReservations = [];
        this.applyFilters();
        this.loading.set(false);
      }
    });
  }

  applyFilters() {
    let filtered = [...this.allReservations];
    
    if (this.eventTypeFilter) {
      filtered = filtered.filter(reservation => reservation.eventTypeCode === this.eventTypeFilter);
    }
    
    if (this.statusFilter) {
      filtered = filtered.filter(reservation => reservation.status === this.statusFilter);
    }
    
    if (this.dateFromFilter) {
      const fromDate = new Date(this.dateFromFilter);
      filtered = filtered.filter(reservation => new Date(reservation.reservationDate) >= fromDate);
    }
    
    if (this.dateToFilter) {
      const toDate = new Date(this.dateToFilter);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(reservation => new Date(reservation.reservationDate) <= toDate);
    }
    
    this.filteredReservations.set(filtered);
    this.reservations.set(filtered);
    this.currentPage.set(1);
  }

  hasActiveFilters(): boolean {
    return !!(this.eventTypeFilter || this.statusFilter || this.dateFromFilter || this.dateToFilter);
  }

  clearFilters() {
    this.eventTypeFilter = '';
    this.statusFilter = '';
    this.dateFromFilter = '';
    this.dateToFilter = '';
    this.applyFilters();
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Pending': 'pending',
      'Confirmed': 'confirmed',
      'Cancelled': 'cancelled',
      'Rejected': 'rejected'
    };
    return statusMap[status] || 'pending';
  }

  getEventClass(eventCode: string): string {
    const eventMap: { [key: string]: string } = {
      'birthday': 'birthday',
      'meeting': 'meeting',
      'celebration': 'celebration',
      'wedding': 'wedding',
      'anniversary': 'anniversary',
      'graduation': 'graduation',
      'baby_shower': 'baby_shower',
      'quinceañera': 'quinceañera',
      'family_reunion': 'family_reunion',
      'corporate': 'corporate',
      'social': 'social',
      'other': 'other'
    };
    return eventMap[eventCode] || 'other';
  }

  getEventIcon(eventCode: string): string {
    const iconMap: { [key: string]: string } = {
      'birthday': 'pi-gift',
      'meeting': 'pi-users',
      'celebration': 'pi-star',
      'wedding': 'pi-heart',
      'anniversary': 'pi-heart-fill',
      'graduation': 'pi-graduation-cap',
      'baby_shower': 'pi-sun',
      'quinceañera': 'pi-sparkles',
      'family_reunion': 'pi-home',
      'corporate': 'pi-briefcase',
      'social': 'pi-comments',
      'other': 'pi-ellipsis-h'
    };
    return iconMap[eventCode] || 'pi-ellipsis-h';
  }

  getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'Pending': 'pi-clock',
      'Confirmed': 'pi-check-circle',
      'Cancelled': 'pi-ban',
      'Rejected': 'pi-times-circle'
    };
    return iconMap[status] || 'pi-clock';
  }

  isValidTimeRange(): boolean {
    if (!this.startTime || !this.endTime) return true;
    return this.timeToMinutes(this.startTime) < this.timeToMinutes(this.endTime);
  }

  createReservation() {
    if (!this.selectedDateStr || !this.startTime || !this.endTime || !this.selectedEventType) return;
    
    if (!this.isValidTimeRange()) {
      this.showErrorMessage('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }
    
    this.loading.set(true);
    
    const reservation = {
      reservationDate: this.selectedDateStr,
      startTime: this.startTime + ':00',
      endTime: this.endTime + ':00',
      eventTypeCode: this.selectedEventType,
      notes: this.notes
    };
    
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
      'Pending': 'Pendiente',
      'Confirmed': 'Confirmada',
      'Cancelled': 'Cancelada',
      'Rejected': 'Rechazada'
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
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  selectedReservation = signal<any>(null);
  showDetailModal = signal(false);
  
  viewReservationDetail(reservation: any) {
    this.selectedReservation.set(reservation);
    this.showDetailModal.set(true);
  }
}