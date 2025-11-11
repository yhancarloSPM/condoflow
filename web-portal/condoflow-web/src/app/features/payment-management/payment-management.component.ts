import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../core/services/auth.service';
import { AdminPaymentService } from '../../core/services/admin-payment.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { PaymentStatus, PaymentAction } from '../../shared/enums/payment-status.enum';
import { Payment, PaymentFilters, PaymentStatusCounts } from './models/payment.models';
import { PaymentUtilsService } from './services/payment-utils.service';
import { PaginationService } from './services/pagination.service';
import { ToastService } from '../../shared/services/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-payment-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule, NavbarComponent],
  providers: [MessageService],
  templateUrl: './payment-management.component.html',
  styleUrls: ['./payment-management.component.scss']
})
export class PaymentManagementComponent implements OnInit {
  currentUser = signal<any>(null);
  payments = signal<Payment[]>([]);
  loading = signal(false);
  processingPayment = signal<string | null>(null);
  
  // Filtros y búsqueda
  searchTerm = signal('');
  statusFilter = signal('');
  dateFilter = signal('');
  sortBy = signal('date-desc');
  
  // Paginación
  currentPage = signal(1);
  pageSize = 10;
  
  // Modal
  showModal = signal(false);
  modalType = signal<PaymentAction>(PaymentAction.APPROVE);
  selectedPayment = signal<Payment | null>(null);
  rejectionReason = '';
  actionType = signal<PaymentAction | null>(null);
  openDropdown = signal<string | null>(null);
  
  // Enums para el template
  PaymentStatus = PaymentStatus;
  PaymentAction = PaymentAction;
  
  // Computed properties
  statusCounts = computed((): PaymentStatusCounts => {
    const payments = this.payments();
    return {
      pending: payments.filter(p => p.status === PaymentStatus.PENDING).length,
      approved: payments.filter(p => p.status === PaymentStatus.APPROVED).length,
      rejected: payments.filter(p => p.status === PaymentStatus.REJECTED).length
    };
  });
  
  // Computed properties
  filteredPayments = computed(() => {
    let filtered = this.payments();
    
    // Filtro por búsqueda
    if (this.searchTerm()) {
      const searchLower = this.searchTerm().toLowerCase();
      filtered = filtered.filter(p => 
        (p.ownerName || '').toLowerCase().includes(searchLower) ||
        (p.paymentMethod || '').toLowerCase().includes(searchLower) ||
        (p.concept || '').toLowerCase().includes(searchLower)
      );
    }
    
    // Filtro por estado
    if (this.statusFilter()) {
      filtered = filtered.filter(p => p.status === this.statusFilter());
    }
    
    // Filtro por fecha
    if (this.dateFilter()) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      filtered = filtered.filter(p => {
        const paymentDate = new Date(p.paymentDate);
        
        switch (this.dateFilter()) {
          case 'current-month':
            return paymentDate.getFullYear() === currentYear && paymentDate.getMonth() === currentMonth;
          case 'last-3-months':
            const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            return paymentDate >= threeMonthsAgo;
          case 'last-6-months':
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
            return paymentDate >= sixMonthsAgo;
          case 'current-year':
            return paymentDate.getFullYear() === currentYear;
          default:
            return true;
        }
      });
    }
    
    // Ordenamiento normal
    filtered.sort((a, b) => {
      switch (this.sortBy()) {
        case 'date-desc': 
          const dateA = new Date(a.createdAt || a.paymentDate);
          const dateB = new Date(b.createdAt || b.paymentDate);
          return dateB.getTime() - dateA.getTime();
        case 'date-asc': 
          const dateA2 = new Date(a.createdAt || a.paymentDate);
          const dateB2 = new Date(b.createdAt || b.paymentDate);
          return dateA2.getTime() - dateB2.getTime();
        case 'amount-desc': 
          return (b.amount || 0) - (a.amount || 0);
        case 'amount-asc': return (a.amount || 0) - (b.amount || 0);
        default: return 0;
      }
    });
    
    return filtered;
  });
  
  totalPages = computed(() => Math.ceil(this.filteredPayments().length / this.pageSize));
  
  paginatedPayments = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredPayments().slice(start, end);
  });

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private adminPaymentService: AdminPaymentService,
    private messageService: MessageService,
    private paymentUtils: PaymentUtilsService,
    private paginationService: PaginationService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.currentUser.set(this.authService.currentUser());
    
    // Leer query parameters para filtro inicial
    this.route.queryParams.subscribe(params => {
      if (params['status']) {
        this.statusFilter.set(params['status']);
      }
    });
    
    this.loadAllPayments();
  }

  loadAllPayments() {
    this.loading.set(true);
    this.adminPaymentService.getAllPayments().subscribe({
      next: (response) => {
        if (response.success) {
          const paymentsWithOwnerInfo: Payment[] = response.data.map((payment: any) => ({
            id: payment.id,
            ownerName: payment.ownerName,
            amount: payment.amount,
            currency: payment.currency,
            paymentMethod: payment.paymentMethod,
            paymentDate: new Date(payment.paymentDate),
            createdAt: new Date(payment.createdAt),
            status: payment.status as PaymentStatus,
            receiptUrl: payment.receiptUrl,
            concept: payment.concept || 'Cuota de mantenimiento',
            rejectionReason: payment.rejectionReason,
            processedAt: payment.processedAt ? new Date(payment.processedAt) : null
          }));
          this.payments.set(paymentsWithOwnerInfo);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando pagos:', error);
        this.loading.set(false);
      }
    });
  }

  updateSearchTerm(event: any) {
    this.searchTerm.set(event.target.value);
    this.currentPage.set(1);
  }
  
  updateStatusFilter(event: any) {
    this.statusFilter.set(event.target.value);
    this.currentPage.set(1);
  }
  
  updateDateFilter(event: any) {
    this.dateFilter.set(event.target.value);
    this.currentPage.set(1);
  }
  
  updateSortBy(event: any) {
    this.sortBy.set(event.target.value);
    this.currentPage.set(1);
    // Forzar actualización
    const currentPayments = this.payments();
    this.payments.set([...currentPayments]);
  }
  
  getPaymentsByStatus(status: PaymentStatus) {
    return this.payments().filter(p => p.status === status);
  }
  
  viewReceipt(payment: Payment) {
    if (payment.id) {
      const token = this.authService.getToken();
      const url = `${environment.apiUrl}/receipts/${payment.id}?access_token=${token}`;
      window.open(url, '_blank');
    }
  }
  
  showApprovalModal(payment: Payment) {
    this.selectedPayment.set(payment);
    this.modalType.set(PaymentAction.APPROVE);
    this.showModal.set(true);
  }
  
  showRejectionModal(payment: Payment) {
    this.selectedPayment.set(payment);
    this.modalType.set(PaymentAction.REJECT);
    this.rejectionReason = '';
    this.showModal.set(true);
  }
  
  closeModal() {
    this.showModal.set(false);
    this.selectedPayment.set(null);
    this.rejectionReason = '';
  }
  
  confirmAction() {
    const payment = this.selectedPayment();
    if (!payment) return;
    
    if (this.modalType() === PaymentAction.APPROVE) {
      this.approvePayment(payment.id);
    } else {
      if (!this.rejectionReason.trim()) {
        return;
      }
      this.rejectPayment(payment.id);
    }
    this.closeModal();
  }
  
  approvePayment(paymentId: string) {
    this.processingPayment.set(paymentId);
    this.actionType.set(PaymentAction.APPROVE);
    this.adminPaymentService.approvePayment(paymentId).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.showSuccess('El pago ha sido aprobado exitosamente');
          this.loadAllPayments();
        }
        this.processingPayment.set(null);
        this.actionType.set(null);
      },
      error: (error) => {
        console.error('Error aprobando pago:', error);
        this.toastService.showError('Error al aprobar el pago');
        this.processingPayment.set(null);
        this.actionType.set(null);
      }
    });
  }

  rejectPayment(paymentId: string) {
    this.processingPayment.set(paymentId);
    this.actionType.set(PaymentAction.REJECT);
    this.adminPaymentService.rejectPayment(paymentId, this.rejectionReason).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.showSuccess('El pago ha sido rechazado exitosamente');
          this.loadAllPayments();
        }
        this.processingPayment.set(null);
        this.actionType.set(null);
      },
      error: (error) => {
        console.error('Error rechazando pago:', error);
        this.toastService.showError('Error al rechazar el pago');
        this.processingPayment.set(null);
        this.actionType.set(null);
      }
    });
  }
  
  // Paginación
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }
  
  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.goToPage(this.currentPage() + 1);
    }
  }
  
  prevPage() {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }
  
  getPageNumbers(): (number | string)[] {
    return this.paginationService.getPageNumbers(this.currentPage(), this.totalPages());
  }
  
  Math = Math;

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'A';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  getStatusText(status: PaymentStatus): string {
    return this.paymentUtils.getStatusText(status);
  }

  getStatusSeverity(status: PaymentStatus): string {
    return this.paymentUtils.getStatusSeverity(status);
  }

  getStatusBadgeClass(status: PaymentStatus): string {
    return this.paymentUtils.getStatusBadgeClass(status);
  }
  
  getStatusIcon(status: PaymentStatus): string {
    return this.paymentUtils.getStatusIcon(status);
  }

  navigateToHome(): void {
    this.router.navigate(['/welcome']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }

  toggleDropdown(paymentId: string) {
    this.openDropdown.set(this.openDropdown() === paymentId ? null : paymentId);
  }

  selectAction(payment: Payment, action: PaymentAction) {
    this.openDropdown.set(null);
    if (action === PaymentAction.APPROVE) {
      this.showApprovalModal(payment);
    } else {
      this.showRejectionModal(payment);
    }
  }
}