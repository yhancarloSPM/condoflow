import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { DebtService } from '../../core/services/debt.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { PaymentService } from '../../core/services/payment.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-my-debts',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './my-debts.component.html',
  styleUrls: ['./my-debts.component.scss']
})
export class MyDebtsComponent implements OnInit, OnDestroy {
  currentUser = signal<any>(null);
  loading = signal(false);
  currentDebts = signal<any[]>([]);
  overdueDebts = signal<any[]>([]);
  paidDebts = signal<any[]>([]);
  paymentSubmittedDebts = signal<any[]>([]);
  recentPayments = signal<any[]>([]);
  selectedYear = new Date().getFullYear();
  availableYears: number[] = [];
  private routerSubscription?: Subscription;

  months = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  constructor(
    private authService: AuthService,
    private router: Router,
    private debtService: DebtService,
    private paymentService: PaymentService
  ) {}

  ngOnInit() {
    this.currentUser.set(this.authService.currentUser());
    this.initializeYears(); // Inicializar años antes de cargar datos
    this.loadDebts();
    this.loadRecentPayments();
    
    // Recargar datos cuando se navega a esta ruta
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (event.url === '/my-debts') {
          this.loadDebts();
          this.loadRecentPayments();
        }
      });
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
  }

  initializeYears() {
    const currentYear = new Date().getFullYear();
    // Inicializar solo con el año actual
    // calculateAvailableYears() se encargará de agregar años históricos basados en las deudas reales
    this.availableYears = [currentYear];
    this.selectedYear = currentYear;
  }

  onYearChange() {
    this.filterDebtsByYear();
    this.loadRecentPayments();
  }

  onYearChangeEvent(event: any) {
    this.selectedYear = parseInt(event.target.value);
    this.onYearChange();
  }

  allDebtsData: any = null;

  loadDebts() {
    const user = this.currentUser();
    if (!user?.ownerId) return;
    
    this.loading.set(true);
    this.debtService.getDebts(user.ownerId.toLowerCase()).subscribe({
      next: (response) => {
        if (response.success) {
          // Guardar todos los datos sin filtrar
          this.allDebtsData = response.data;
          
          // Calcular años disponibles basados en las deudas
          this.calculateAvailableYears();
          
          // Aplicar filtro por año
          this.filterDebtsByYear();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando deudas:', error);
        this.loading.set(false);
      }
    });
  }

  calculateAvailableYears() {
    const currentYear = new Date().getFullYear();
    
    if (!this.allDebtsData) {
      // Si no hay datos, solo mostrar el año actual
      this.availableYears = [currentYear];
      this.selectedYear = currentYear;
      return;
    }
    
    // Combinar todas las deudas
    const allDebts = [
      ...(this.allDebtsData.currentDebts || []),
      ...(this.allDebtsData.overdueDebts || []),
      ...(this.allDebtsData.paidDebts || []),
      ...(this.allDebtsData.paymentSubmittedDebts || [])
    ];
    
    if (allDebts.length === 0) {
      // Si no hay deudas, solo mostrar el año actual
      this.availableYears = [currentYear];
      this.selectedYear = currentYear;
      return;
    }
    
    // Obtener años únicos de las deudas usando dueDate, filtrando años futuros
    const years = [...new Set(allDebts.map(d => new Date(d.dueDate).getFullYear()))]
      .filter(y => y <= currentYear);
    
    if (years.length === 0) {
      // Si no hay años válidos, solo mostrar el año actual
      this.availableYears = [currentYear];
      this.selectedYear = currentYear;
      return;
    }
    
    const minYear = Math.min(...years);
    const maxYear = currentYear;
    
    const availableYears: number[] = [];
    for (let year = minYear; year <= maxYear; year++) {
      availableYears.push(year);
    }
    
    this.availableYears = availableYears.sort((a, b) => b - a); // Descendente
    
    // Si el año seleccionado no está en los disponibles, usar el año actual
    if (!availableYears.includes(this.selectedYear)) {
      this.selectedYear = currentYear;
    }
  }

  filterDebtsByYear() {
    if (!this.allDebtsData) return;
    
    const filterByYear = (debts: any[]) => {
      return debts.filter((debt: any) => {
        const dueDate = new Date(debt.dueDate);
        const year = dueDate.getFullYear();
        const selectedYearNum = this.selectedYear;
        return year === selectedYearNum;
      });
    };
    
    this.currentDebts.set(filterByYear(this.allDebtsData.currentDebts || []));
    this.overdueDebts.set(filterByYear(this.allDebtsData.overdueDebts || []));
    this.paidDebts.set(filterByYear(this.allDebtsData.paidDebts || []));
    this.paymentSubmittedDebts.set(filterByYear(this.allDebtsData.paymentSubmittedDebts || []));
  }

  loadRecentPayments() {
    const user = this.currentUser();
    if (!user?.ownerId) return;
    
    this.paymentService.getPayments(user.ownerId.toLowerCase()).subscribe({
      next: (response) => {
        if (response.success) {
          const payments = response.data || [];
          // Filtrar pagos por año seleccionado
          const filteredPayments = payments.filter((payment: any) => {
            const paymentDate = new Date(payment.paymentDate);
            return paymentDate.getFullYear() === this.selectedYear;
          });
          this.recentPayments.set(filteredPayments);
        }
      },
      error: (error) => {
        console.error('Error cargando pagos:', error);
      }
    });
  }

  totalPending(): number {
    return this.currentDebts().length;
  }

  totalOverdue(): number {
    return this.overdueDebts().length;
  }

  totalDebts(): number {
    return this.totalPaid() + this.totalPending() + this.totalOverdue();
  }

  totalPaid(): number {
    return this.paidDebts().length;
  }

  getPaymentStatusClass(status: string): string {
    switch (status) {
      case 'Approved': return 'approved';
      case 'Pending': return 'pending';
      case 'Rejected': return 'rejected';
      default: return 'pending';
    }
  }

  getPaymentStatusText(status: string): string {
    switch (status) {
      case 'Approved': return 'APROBADO';
      case 'Pending': return 'PENDIENTE';
      case 'Rejected': return 'RECHAZADO';
      default: return 'PENDIENTE';
    }
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'U';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  navigateToHome(): void {
    this.router.navigate(['/welcome']);
  }

  getDebtForMonth(month: number): any {
    const allDebts = [...this.currentDebts(), ...this.overdueDebts(), ...this.paidDebts(), ...this.paymentSubmittedDebts()];
    return allDebts.find(debt => {
      const dueDate = new Date(debt.dueDate);
      return dueDate.getMonth() + 1 === month;
    });
  }

  getMonthStatus(month: number): string {
    const debt = this.getDebtForMonth(month);
    if (!debt) return 'no-debt';
    
    if (debt.status === 'Paid') return 'paid';
    if (debt.status === 'PaymentSubmitted') return 'payment-submitted';
    
    const today = new Date();
    const dueDate = new Date(debt.dueDate);
    return dueDate < today ? 'overdue' : 'pending';
  }

  getDebtStatusText(debt: any): string {
    if (debt.status === 'Paid') return 'Pagado';
    if (debt.status === 'PaymentSubmitted') return 'En Revisión';
    
    const today = new Date();
    const dueDate = new Date(debt.dueDate);
    return dueDate < today ? 'Vencido' : 'Pendiente';
  }

  viewReceipt(debt: any): void {
    const payment = this.recentPayments().find(p => p.debtId === debt.id);
    if (payment && payment.receiptUrl) {
      const token = this.authService.getToken();
      const fullUrl = `https://localhost:7009/api/receipts/${payment.id}?access_token=${token}`;
      window.open(fullUrl, '_blank');
    }
  }

  payDebt(debt: any): void {
    this.router.navigate(['/my-payments'], { 
      queryParams: {
        debtId: debt.id,
        amount: debt.amount,
        concept: debt.concept
      }
    });
  }

  viewPaymentStatus(debt: any): void {
    this.router.navigate(['/my-payments']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}