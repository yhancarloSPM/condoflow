import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AuthService } from '../../core/services/auth.service';
import { AdminDebtService } from '../../core/services/admin-debt.service';
import { AdminPaymentService } from '../../core/services/admin-payment.service';
import { NotificationService } from '../../core/services/notification.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { NavbarComponent } from '../../shared/components/navbar.component';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('incomeChart') incomeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('morosityChart') morosityChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChart') pieChartRef!: ElementRef<HTMLCanvasElement>;

  
  currentUser = signal<any>(null);
  debts = signal<any[]>([]);
  apartments = signal<any[]>([]);
  blocks = signal<any[]>([]);
  payments = signal<any[]>([]);
  incidents = signal<any[]>([]);
  pendingApprovals = signal<number>(0);
  occupancyRate = signal<number>(0);
  collectionEfficiency = signal<number>(0);

  
  incomeChart: Chart | null = null;
  morosityChart: Chart | null = null;
  pieChart: Chart | null = null;


  constructor(
    private authService: AuthService,
    public router: Router,
    private adminDebtService: AdminDebtService,
    private adminPaymentService: AdminPaymentService,
    private notificationService: NotificationService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.currentUser.set(this.authService.currentUser());
    this.loadDebts();
    this.loadBlocks();
    this.loadApartments();
    this.loadPayments();
    this.loadIncidents();
    this.loadNotifications();
    this.calculateMetrics();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initCharts();
    }, 100);
  }

  loadDebts() {
    this.adminDebtService.getAllDebts().subscribe({
      next: (response) => {
        if (response.success) {
          // Limitar a las primeras 1000 deudas para performance
          const limitedDebts = response.data.slice(0, 1000);
          this.debts.set(limitedDebts);
          this.updateCharts();
        }
      },
      error: (error) => {
        console.error('Error cargando deudas:', error);
      }
    });
  }

  loadBlocks() {
    this.http.get(`${environment.apiUrl}/blocks`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.blocks.set(response.data);
        }
      },
      error: (error) => console.error('Error cargando bloques:', error)
    });
  }

  loadApartments() {
    this.http.get(`${environment.apiUrl}/apartments`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.apartments.set(response.data);
        }
      },
      error: (error) => console.error('Error cargando apartamentos:', error)
    });
  }

  loadPayments() {
    this.adminPaymentService.getAllPayments().subscribe({
      next: (response) => {
        if (response.success) {
          this.payments.set(response.data);
          this.updateCharts();
        }
      },
      error: (error) => console.error('Error cargando pagos:', error)
    });
  }

  initCharts() {
    this.createIncomeChart();
    this.createMorosityChart();
    this.createPieChart();
  }







  updateCharts() {
    if (this.incomeChart) {
      const income = [85000, 92000, 78000, 95000, 88000, this.getTotalIncome()];
      const expenses = [45000, 48000, 52000, 46000, 49000, this.getTotalExpenses()];
      this.incomeChart.data.datasets[0].data = income;
      this.incomeChart.data.datasets[1].data = expenses;
      this.incomeChart.update();
    }
    
    if (this.morosityChart) {
      const morosityRate = [15, 18, 12, 22, 16, this.getOverduePercentage()];
      this.morosityChart.data.datasets[0].data = morosityRate;
      this.morosityChart.update();
    }
    
    if (this.pieChart) {
      const pending = this.totalPending();
      const paid = this.totalPaid();
      const overdue = this.totalOverdue();
      
      const hasData = pending > 0 || paid > 0 || overdue > 0;
      this.pieChart.data.datasets[0].data = hasData ? [pending, paid, overdue] : [1];
      this.pieChart.data.labels = hasData ? ['Pendientes', 'Pagadas', 'Vencidas'] : ['Sin deudas registradas'];
      this.pieChart.data.datasets[0].backgroundColor = hasData ? ['#f59e0b', '#10b981', '#ef4444'] : ['#e5e7eb'];
      this.pieChart.update();
    }
  }



  totalPending() { 
    return this.debts().filter(d => d.status === 'Pending' || d.status === 'PaymentSubmitted').length;
  }
  totalPaid() { 
    return this.debts().filter(d => d.status === 'Paid').length;
  }
  totalOverdue() { 
    return this.debts().filter(d => d.status === 'Overdue').length;
  }
  
  getAvgResponseTime(): number {
    // Simular tiempo promedio de aprobación (en horas)
    const pendingPayments = this.payments().filter(p => p.status === 'pending');
    return pendingPayments.length > 5 ? 48 : 24; // Más de 5 pendientes = más lento
  }
  
  getHealthScore(): number {
    const totalDebts = this.debts().length;
    const overdueDebts = this.totalOverdue();
    const pendingApprovals = this.pendingApprovals();
    
    if (totalDebts === 0) return 10;
    
    let score = 10;
    score -= (overdueDebts / totalDebts) * 4; // -4 puntos por morosidad
    score -= Math.min(pendingApprovals * 0.5, 3); // -0.5 por pago pendiente, máx -3
    score -= this.getUrgentIncidents() * 0.5; // -0.5 por incidencia urgente
    
    return Math.max(Math.round(score), 1);
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'A';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }







  loadIncidents() {
    this.http.get(`${environment.apiUrl}/incidents`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.incidents.set(response.data);
        }
      },
      error: (error) => {
        // Datos de ejemplo para mostrar funcionalidad
        this.incidents.set([
          { status: 'Open', priority: 'High' },
          { status: 'Open', priority: 'High' }
        ]);
      }
    });
  }

  getCriticalOverdue(): number {
    const today = new Date();
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    return this.debts().filter(d => {
      const dueDate = new Date(d.dueDate);
      return d.status === 'Overdue' && dueDate < ninetyDaysAgo;
    }).length;
  }
  
  navigateToOverdueDebts(): void {
    this.router.navigate(['/debt-management'], { queryParams: { filter: 'overdue' } });
  }

  calculateMetrics() {
    // Pagos pendientes de aprobación
    const pending = this.payments().filter(p => p.status === 'pending').length;
    this.pendingApprovals.set(pending);
    
    // Tasa de ocupación (apartamentos con deudas activas)
    const totalApartments = this.apartments().length;
    const occupiedApartments = new Set(this.debts().map(d => d.apartment)).size;
    const rate = totalApartments > 0 ? Math.round((occupiedApartments / totalApartments) * 100) : 0;
    this.occupancyRate.set(rate);
    
    // Eficiencia de cobranza (pagos a tiempo vs total)
    const totalDebts = this.debts().length;
    const paidOnTime = this.debts().filter(d => d.status === 'Paid' && !d.isOverdue).length;
    const efficiency = totalDebts > 0 ? Math.round((paidOnTime / totalDebts) * 100) : 0;
    this.collectionEfficiency.set(efficiency);
  }

  getUrgentIncidents(): number {
    return this.incidents().filter(i => i.priority === 'High' && i.status === 'Open').length;
  }

  getDebtsDueSoon(): number {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return this.debts().filter(d => {
      const dueDate = new Date(d.dueDate);
      return d.status === 'Pending' && dueDate >= today && dueDate <= nextWeek;
    }).length;
  }

  navigateToHome(): void { this.router.navigate(['/welcome']); }
  navigateToDebtManagement(): void { this.router.navigate(['/debt-management']); }
  navigateToPaymentsByStatus(status: string): void { this.router.navigate(['/payment-management'], { queryParams: { status: status } }); }
  navigateToAnnouncements(): void { 
    this.router.navigate(['/announcement-management']);
  }
  
  navigateToIncidents(): void {
    this.router.navigate(['/incident-management']);
  }
  
  navigateToPendingPayments(): void {
    this.router.navigate(['/payment-management'], { queryParams: { status: 'pending' } });
  }
  
  navigateToMorosityReport(): void {
    this.router.navigate(['/morosity-report']);
  }
  
  navigateToOwnersReport(): void {
    this.router.navigate(['/owners-report']);
  }
  
  getInactiveOwners(): number {
    return 3; // Placeholder - propietarios sin actividad reciente
  }
  
  getPaymentsInReview(): number {
    return this.debts().filter(d => d.status === 'PaymentSubmitted').length;
  }
  
  getTotalRequirePayment(): number {
    return this.debts().filter(d => d.status === 'Pending' || d.status === 'Overdue').length;
  }
  
  async loadNotifications() {
    try {
      await this.notificationService.startConnection();
      console.log('[DASHBOARD] Notificaciones inicializadas');
    } catch (error) {
      console.error('[DASHBOARD] Error inicializando notificaciones:', error);
    }
  }
  
  // Métodos Financieros
  getTotalIncome(): number {
    return this.debts()
      .filter(d => d.status === 'Paid' && d.month === new Date().getMonth() + 1)
      .reduce((sum, d) => sum + d.amount, 0);
  }
  
  getTotalExpenses(): number {
    return 45000; // Placeholder - gastos fijos mensuales
  }
  
  getAvailableBalance(): number {
    return this.getTotalIncome() - this.getTotalExpenses();
  }
  
  getOverdueAmount(): number {
    return this.debts()
      .filter(d => d.status === 'Overdue')
      .reduce((sum, d) => sum + d.amount, 0);
  }
  
  getPaidApartments(): number {
    const currentMonth = new Date().getMonth() + 1;
    return new Set(
      this.debts()
        .filter(d => d.status === 'Paid' && d.month === currentMonth)
        .map(d => d.apartment)
    ).size;
  }
  
  getBalancePercentage(): number {
    const income = this.getTotalIncome();
    return income > 0 ? Math.round(((income - this.getTotalExpenses()) / income) * 100) : 0;
  }
  
  getOverduePercentage(): number {
    const total = this.debts().length;
    const overdue = this.totalOverdue();
    return total > 0 ? Math.round((overdue / total) * 100) : 0;
  }
  
  getTopDebtors() {
    const debtorMap = new Map();
    
    this.debts()
      .filter(d => d.status === 'Overdue')
      .forEach(debt => {
        const key = debt.apartment;
        if (debtorMap.has(key)) {
          const existing = debtorMap.get(key);
          existing.amount += debt.amount;
          existing.months += 1;
        } else {
          debtorMap.set(key, {
            apartment: debt.apartment,
            amount: debt.amount,
            months: 1
          });
        }
      });
    
    return Array.from(debtorMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }
  
  createIncomeChart() {
    const ctx = this.incomeChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const income = [85000, 92000, 78000, 95000, 88000, this.getTotalIncome()];
    const expenses = [45000, 48000, 52000, 46000, 49000, this.getTotalExpenses()];
    
    this.incomeChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Ingresos',
            data: income,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Gastos',
            data: expenses,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: 'white' }
          }
        },
        scales: {
          x: {
            ticks: { color: 'white' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: 'white',
              callback: function(value) {
                return '$' + (value as number).toLocaleString();
              }
            },
            grid: { color: 'rgba(255,255,255,0.1)' }
          }
        }
      }
    });
  }
  
  createMorosityChart() {
    const ctx = this.morosityChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const morosityRate = [15, 18, 12, 22, 16, this.getOverduePercentage()];
    
    this.morosityChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Morosidad %',
          data: morosityRate,
          backgroundColor: '#f59e0b',
          borderColor: '#d97706',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            ticks: { color: 'white' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          y: {
            beginAtZero: true,
            max: 30,
            ticks: {
              color: 'white',
              callback: function(value) {
                return value + '%';
              }
            },
            grid: { color: 'rgba(255,255,255,0.1)' }
          }
        }
      }
    });
  }
  
  createPieChart() {
    const ctx = this.pieChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const pending = this.totalPending();
    const paid = this.totalPaid();
    const overdue = this.totalOverdue();
    
    const hasData = pending > 0 || paid > 0 || overdue > 0;
    const data = hasData ? [pending, paid, overdue] : [1];
    const labels = hasData ? ['Pendientes', 'Pagadas', 'Vencidas'] : ['Sin deudas registradas'];
    const colors = hasData ? ['#f59e0b', '#10b981', '#ef4444'] : ['#e5e7eb'];

    this.pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            position: 'bottom',
            labels: { color: 'white' }
          },
          tooltip: {
            enabled: hasData
          }
        }
      }
    });
  }
  
  logout(): void { this.authService.logout(); this.router.navigate(['/auth']); }
}