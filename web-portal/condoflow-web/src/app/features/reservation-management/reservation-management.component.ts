import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../core/services/auth.service';
import { ReservationService } from '../../core/services/reservation.service';
import { NotificationService } from '../../core/services/notification.service';
import { CatalogService, CatalogItem } from '../../core/services/catalog.service';
import { ReservationFiltersComponent } from './components/reservation-filters.component';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { Reservation, ReservationStatus, ReservationStatusCounts, ReservationFilters } from './models/reservation.models';

interface FilterData {
  statusFilter: string;
  eventTypeFilter: string;
  dateFilter: string;
  searchTerm: string;
}

@Component({
  selector: 'app-reservation-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule, ReservationFiltersComponent, NavbarComponent],
  providers: [MessageService],
  templateUrl: './reservation-management.component.html',
  styleUrls: ['./reservation-management.component.scss']
})
export class ReservationManagementComponent implements OnInit, OnDestroy {
  reservationStatus = ReservationStatus;
  currentUser = signal<any>(null);
  loading = signal(false);
  reservations = signal<Reservation[]>([]);
  
  showRejectModal = signal(false);
  showApprovalModalVisible = signal(false);
  selectedReservation = signal<Reservation | null>(null);
  selectedReservationId = signal('');
  rejectionReason = signal('');
  
  showCancellationModal = signal(false);
  selectedCancellation = signal<Reservation | null>(null);
  
  showDetailModal = signal(false);
  selectedReservationDetail = signal<Reservation | null>(null);
  
  currentPage = signal(1);
  pageSize = 10;
  
  filteredReservations = signal<Reservation[]>([]);
  filterData: FilterData = {
    statusFilter: '',
    eventTypeFilter: '',
    dateFilter: '',
    searchTerm: ''
  };
  
  statusCounts = computed((): ReservationStatusCounts => {
    const reservations = this.reservations();
    console.log('Computing status counts for reservations:', reservations);
    console.log('Sample reservation status:', reservations[0]?.status);
    
    const counts = {
      pending: reservations.filter(r => r.status as string === 'Pending' || r.status === ReservationStatus.PENDING).length,
      confirmed: reservations.filter(r => r.status as string === 'Confirmed' || r.status === ReservationStatus.CONFIRMED).length,
      rejected: reservations.filter(r => r.status as string === 'Rejected' || r.status === ReservationStatus.REJECTED).length,
      cancelled: reservations.filter(r => r.status as string === 'Cancelled' || r.status === ReservationStatus.CANCELLED).length
    };
    
    console.log('Computed counts:', counts);
    return counts;
  });
  
  // Catálogos
  reservationStatuses = signal<CatalogItem[]>([]);
  eventTypes = signal<CatalogItem[]>([]);
  
  paginatedReservations = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredReservations().slice(start, end);
  });
  
  totalPages = computed(() => Math.ceil(this.filteredReservations().length / this.pageSize));

  constructor(
    private router: Router,
    private authService: AuthService,
    private reservationService: ReservationService,
    private messageService: MessageService,
    public notificationService: NotificationService,
    private catalogService: CatalogService
  ) {}

  async ngOnInit() {
    this.currentUser.set(this.authService.user());
    this.loadCatalogs();
    this.loadAllReservations();
    await this.notificationService.startConnection();
  }

  private loadCatalogs() {
    // Cargar estados de reserva
    this.catalogService.getReservationStatuses().subscribe({
      next: (response) => {
        console.log('Reservation statuses response:', response);
        if (response.success && response.data) {
          const reservationStatuses = response.data
            .filter((item: CatalogItem) => ['pending', 'confirmed', 'rejected', 'cancelled'].includes(item.code))
            .sort((a: CatalogItem, b: CatalogItem) => a.name.localeCompare(b.name));
          console.log('Filtered reservation statuses:', reservationStatuses);
          this.reservationStatuses.set(reservationStatuses);
        }
      },
      error: (error) => console.error('Error loading reservation statuses:', error)
    });

    // Cargar tipos de evento
    this.catalogService.getEventTypes().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const eventTypes = response.data
            .filter((item: CatalogItem) => item.isActive)
            .sort((a: CatalogItem, b: CatalogItem) => a.name.localeCompare(b.name));
          this.eventTypes.set(eventTypes);
        }
      },
      error: (error) => console.error('Error loading event types:', error)
    });
  }

  loadAllReservations() {
    this.loading.set(true);
    this.reservationService.getAllReservations().subscribe({
      next: (response) => {
        this.reservations.set(response.data || []);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading reservations:', error);
        this.reservations.set([]);
        this.applyFilters();
        this.loading.set(false);
      }
    });
  }

  onFiltersChange(filters: FilterData) {
    this.filterData = filters;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.reservations()];
    
    if (this.filterData.statusFilter) {
      // Mapear el código del filtro al valor real del status
      const statusMap: { [key: string]: string[] } = {
        'pending': ['Pending', ReservationStatus.PENDING],
        'confirmed': ['Confirmed', ReservationStatus.CONFIRMED],
        'rejected': ['Rejected', ReservationStatus.REJECTED],
        'cancelled': ['Cancelled', ReservationStatus.CANCELLED]
      };
      
      const validStatuses = statusMap[this.filterData.statusFilter] || [this.filterData.statusFilter];
      filtered = filtered.filter(r => validStatuses.includes(r.status as string));
    }
    
    if (this.filterData.eventTypeFilter) {
      filtered = filtered.filter(r => r.eventTypeCode === this.filterData.eventTypeFilter);
    }
    
    if (this.filterData.dateFilter) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      filtered = filtered.filter(r => {
        const reservationDate = new Date(r.reservationDate);
        
        switch (this.filterData.dateFilter) {
          case 'current-month':
            return reservationDate.getFullYear() === currentYear && 
                   reservationDate.getMonth() === currentMonth;
          case 'last-3-months':
            const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            return reservationDate >= threeMonthsAgo;
          case 'last-6-months':
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
            return reservationDate >= sixMonthsAgo;
          case 'current-year':
            return reservationDate.getFullYear() === currentYear;
          default:
            return true;
        }
      });
    }
    
    if (this.filterData.searchTerm) {
      const term = this.filterData.searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.userName.toLowerCase().includes(term)
      );
    }
    
    // Ordenar por fecha de creación
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    this.filteredReservations.set(filtered);
    this.currentPage.set(1);
  }



  showApprovalModal(reservation: any) {
    this.selectedReservation.set(reservation);
    this.showApprovalModalVisible.set(true);
  }

  showRejectionModal(reservation: any) {
    this.selectedReservation.set(reservation);
    this.selectedReservationId.set(reservation.id);
    this.rejectionReason.set('');
    this.showRejectModal.set(true);
  }

  confirmApproval() {
    const reservation = this.selectedReservation();
    if (!reservation) return;
    
    this.reservationService.updateReservationStatus(reservation.id, 'Confirmed').subscribe({
      next: () => {
        this.closeApprovalModal();
        this.messageService.add({
          severity: 'success',
          summary: 'Reserva Confirmada',
          detail: 'La reserva ha sido confirmada exitosamente'
        });
        this.loadAllReservations();
      },
      error: (error) => {
        console.error('Error approving reservation:', error);
        this.closeApprovalModal();
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al aprobar la reserva'
        });
      }
    });
  }

  closeApprovalModal() {
    this.showApprovalModalVisible.set(false);
    this.selectedReservation.set(null);
  }

  closeRejectModal() {
    this.showRejectModal.set(false);
    this.selectedReservation.set(null);
    this.selectedReservationId.set('');
    this.rejectionReason.set('');
  }

  confirmRejectReservation() {
    const id = this.selectedReservationId();
    const reason = this.rejectionReason().trim();
    
    if (!reason || reason.length < 10) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'El motivo debe tener al menos 10 caracteres'
      });
      return;
    }
    
    this.reservationService.updateReservationStatus(id, 'Rejected', reason).subscribe({
      next: () => {
        this.closeRejectModal();
        this.messageService.add({
          severity: 'success',
          summary: 'Reserva Rechazada',
          detail: 'La reserva ha sido rechazada exitosamente'
        });
        this.loadAllReservations();
      },
      error: (error) => {
        console.error('Error rejecting reservation:', error);
        this.closeRejectModal();
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Error al rechazar la reserva'
        });
      }
    });
  }

  viewReservationDetail(reservation: any) {
    this.selectedReservationDetail.set(reservation);
    this.showDetailModal.set(true);
  }
  
  closeDetailModal() {
    this.showDetailModal.set(false);
    this.selectedReservationDetail.set(null);
  }

  viewDetails(reservation: any) {
    // TODO: Mostrar modal con detalles completos
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  getEventTypeName(eventTypeCode: string): string {
    if (!eventTypeCode) {
      console.log('Event type code is null/undefined for table column');
      return eventTypeCode;
    }
    const eventType = this.eventTypes().find(et => et.code === eventTypeCode);
    return eventType ? eventType.name : eventTypeCode;
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
      'Pending': 'warning',
      'Confirmed': 'success',
      'Cancelled': 'secondary',
      'Rejected': 'danger'
    };
    return severityMap[status] || 'secondary';
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
    if (!user) return 'A';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  getRowClass(status: string): string {
    switch (status) {
      case ReservationStatus.PENDING: return 'row-pending';
      case ReservationStatus.CONFIRMED: return 'row-confirmed';
      case ReservationStatus.REJECTED: return 'row-rejected';
      case ReservationStatus.CANCELLED: return 'row-cancelled';
      default: return 'row-processed';
    }
  }

  viewCancellationReason(reservation: any) {
    this.selectedCancellation.set(reservation);
    this.showCancellationModal.set(true);
  }

  closeCancellationModal() {
    this.showCancellationModal.set(false);
    this.selectedCancellation.set(null);
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

  isPending(status: any): boolean {
    return status === 'Pending' || status === ReservationStatus.PENDING;
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.notificationService.markAsRead(notificationId);
  }

  async ngOnDestroy() {
    await this.notificationService.stopConnection();
  }
}