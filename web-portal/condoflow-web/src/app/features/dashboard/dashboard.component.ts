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
  @ViewChild('expenseChart') expenseChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('yearlyIncomeChart', { static: false }) yearlyIncomeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('yearlyComparisonChart', { static: false }) yearlyComparisonChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('quarterlyMorosityChart', { static: false }) quarterlyMorosityChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('projectionChart', { static: false }) projectionChartRef!: ElementRef<HTMLCanvasElement>;

  activeTab = signal<string>('monthly');
  selectedMonth = signal<number>(new Date().getMonth() + 1);
  selectedYear = signal<number>(new Date().getFullYear());
  
  currentUser = signal<any>(null);
  debts = signal<any[]>([]);
  apartments = signal<any[]>([]);
  blocks = signal<any[]>([]);
  payments = signal<any[]>([]);
  incidents = signal<any[]>([]);
  expenses = signal<any[]>([]);
  pendingApprovals = signal<number>(0);
  occupancyRate = signal<number>(0);
  collectionEfficiency = signal<number>(0);

  
  incomeChart: Chart | null = null;
  morosityChart: Chart | null = null;
  pieChart: Chart | null = null;
  expenseChart: Chart | null = null;
  yearlyIncomeChart: Chart | null = null;
  yearlyComparisonChart: Chart | null = null;
  quarterlyMorosityChart: Chart | null = null;
  projectionChart: Chart | null = null;


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
    // Load data asynchronously to prevent blocking
    setTimeout(() => {
      this.loadDebts();
      this.loadBlocks();
      this.loadApartments();
      this.loadPayments();
      this.loadIncidents();
      this.loadExpenses();
      this.loadNotifications();
      this.calculateMetrics();
    }, 100);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initCharts();
    }, 100);
  }
  
  onTabChange(tab: string) {
    this.activeTab.set(tab);
    setTimeout(() => {
      this.initCharts();
    }, 100);
  }

  loadDebts() {
    this.adminDebtService.getAllDebts().subscribe({
      next: (response) => {
        if (response.success) {
          // Limitar a las primeras 500 deudas para mejor performance
          const limitedDebts = response.data.slice(0, 500);
          this.debts.set(limitedDebts);
          this.updateCharts();
        }
      },
      error: (error) => {
        console.error('Error cargando deudas:', error);
        // Set empty array on error to prevent blocking
        this.debts.set([]);
        this.updateCharts();
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

  loadExpenses() {
    this.http.get(`${environment.apiUrl}/expenses`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.expenses.set(response.data);
          setTimeout(() => {
            this.updateCharts();
            if (this.activeTab() === 'monthly') {
              this.createExpenseChart();
            }
          }, 100);
        }
      },
      error: (error) => {
        console.error('Error cargando gastos:', error);
        this.expenses.set([]);
      }
    });
  }

  initCharts() {
    if (this.activeTab() === 'monthly') {
      this.createIncomeChart();
      this.createMorosityChart();
      this.createPieChart();
      this.createExpenseChart();
    } else {
      this.createYearlyCharts();
    }
  }
  
  createYearlyCharts() {
    setTimeout(() => {
      if (this.yearlyIncomeChartRef) this.createYearlyIncomeChart();
      if (this.yearlyComparisonChartRef) this.createYearlyComparisonChart();
      if (this.quarterlyMorosityChartRef) this.createQuarterlyMorosityChart();
      if (this.projectionChartRef) this.createProjectionChart();
    }, 200);
  }

  updateCharts() {
    if (this.activeTab() === 'monthly') {
      this.updateMonthlyCharts();
    } else {
      this.updateYearlyCharts();
    }
  }
  
  updateMonthlyCharts() {
    if (this.incomeChart) {
      const income = [this.getTotalIncome()];
      const expenses = [this.getTotalExpenses()];
      this.incomeChart.data.datasets[0].data = income;
      this.incomeChart.data.datasets[1].data = expenses;
      this.incomeChart.update();
    }
    
    if (this.morosityChart) {
      const morosityRate = [this.getOverduePercentage()];
      this.morosityChart.data.datasets[0].data = morosityRate;
      this.morosityChart.update();
    }
    
    if (this.pieChart) {
      const totalApartments = this.apartments().length || 100;
      const paidApartments = this.getPaidApartments();
      const overdueApartments = new Set(this.debts().filter(d => d.status === 'Overdue').map(d => d.apartment)).size;
      const pendingApartments = totalApartments - paidApartments - overdueApartments;
      
      const hasData = totalApartments > 0;
      this.pieChart.data.datasets[0].data = hasData ? [paidApartments, pendingApartments, overdueApartments] : [1];
      this.pieChart.data.labels = hasData ? 
        [`Al Día (${paidApartments})`, `Pendientes (${pendingApartments})`, `Morosos (${overdueApartments})`] : 
        ['Sin datos'];
      this.pieChart.data.datasets[0].backgroundColor = hasData ? ['#10b981', '#f59e0b', '#ef4444'] : ['#e5e7eb'];
      this.pieChart.update();
    }
  }
  
  updateYearlyCharts() {
    if (this.yearlyIncomeChart) {
      const yearlyData = this.getMonthlyIncomeData();
      this.yearlyIncomeChart.data.datasets[0].data = yearlyData;
      this.yearlyIncomeChart.update();
    }
    
    if (this.yearlyComparisonChart) {
      this.yearlyComparisonChart.data.datasets[0].data = [this.getYearlyIncome()];
      this.yearlyComparisonChart.data.datasets[1].data = [this.getYearlyExpenses()];
      this.yearlyComparisonChart.update();
    }
  }
  
  getMonthlyIncomeData(): number[] {
    const monthlyData = [];
    
    for (let month = 1; month <= 12; month++) {
      const monthlyIncome = this.debts()
        .filter(d => {
          if (d.status !== 'Paid') return false;
          // Usar el período de la deuda, no la fecha de pago
          const debtDate = new Date(d.dueDate || d.createdAt);
          return debtDate.getMonth() + 1 === month &&
                 debtDate.getFullYear() === this.selectedYear();
        })
        .reduce((sum, d) => sum + (d.amount || 0), 0);
      monthlyData.push(monthlyIncome);
    }
    
    return monthlyData;
  }



  totalPending() { 
    return this.debts().filter(d => d.status === 'Pending' || d.status === 'PaymentSubmitted').length;
  }
  totalPaid() { 
    return this.debts().filter(d => d.status === 'Paid').length;
  }
  totalOverdue() { 
    return new Set(this.debts().filter(d => d.status === 'Overdue').map(d => d.apartment)).size;
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
    score -= (overdueDebts / totalDebts) * 4;
    score -= Math.min(pendingApprovals * 0.5, 3);
    score -= this.getUrgentIncidents() * 0.5;
    
    return Math.max(Math.round(score * 10) / 10, 1);
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
  
  navigateToWelcome(): void { this.router.navigate(['/welcome']); }
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
      // Don't await to prevent blocking
      this.notificationService.startConnection();
      console.log('[DASHBOARD] Notificaciones inicializadas');
    } catch (error) {
      console.error('[DASHBOARD] Error inicializando notificaciones:', error);
    }
  }
  
  // Métodos Financieros
  getTotalIncome(): number {
    return this.debts()
      .filter(d => {
        if (d.status !== 'Paid') return false;
        
        // Usar el período de la deuda, no la fecha de pago
        const debtDate = new Date(d.dueDate || d.createdAt);
        return debtDate.getMonth() + 1 === this.selectedMonth() &&
               debtDate.getFullYear() === this.selectedYear();
      })
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  }
  
  getYearlyIncome(): number {
    return this.debts()
      .filter(d => {
        if (d.status !== 'Paid') return false;
        // Usar el período de la deuda, no la fecha de pago
        const debtDate = new Date(d.dueDate || d.createdAt);
        return debtDate.getFullYear() === this.selectedYear();
      })
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  }
  
  getYearlyExpenses(): number {
    return this.expenses()
      .filter(e => {
        const expenseDate = new Date(e.createdAt || e.date);
        return e.status?.code === 'paid' && expenseDate.getFullYear() === this.selectedYear();
      })
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }
  
  getYearlyBalance(): number {
    return this.getYearlyIncome() - this.getYearlyExpenses();
  }
  
  getYearlyBalancePercentage(): number {
    const income = this.getYearlyIncome();
    return income > 0 ? Math.round(((income - this.getYearlyExpenses()) / income) * 100) : 0;
  }
  
  getYearlyOverdueAmount(): number {
    return this.debts()
      .filter(d => {
        const debtDate = new Date(d.createdAt || d.dueDate);
        return d.status === 'Overdue' && debtDate.getFullYear() === this.selectedYear();
      })
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  }
  
  getCurrentYear(): number {
    return new Date().getFullYear();
  }
  
  getTotalExpenses(): number {
    return this.expenses()
      .filter(e => {
        const expenseDate = new Date(e.date);
        return e.status?.code === 'paid' &&
               expenseDate.getMonth() + 1 === this.selectedMonth() &&
               expenseDate.getFullYear() === this.selectedYear();
      })
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }
  
  getAvailableBalance(): number {
    return this.getTotalIncome() - this.getTotalExpenses();
  }
  
  getOverdueAmount(): number {
    if (this.activeTab() === 'monthly') {
      return this.debts()
        .filter(d => {
          const debtDate = new Date(d.dueDate || d.createdAt);
          return d.status === 'Overdue' && 
                 debtDate.getMonth() + 1 === this.selectedMonth() &&
                 debtDate.getFullYear() === this.selectedYear();
        })
        .reduce((sum, d) => sum + (d.amount || 0), 0);
    } else {
      return this.debts()
        .filter(d => d.status === 'Overdue')
        .reduce((sum, d) => sum + (d.amount || 0), 0);
    }
  }
  
  getPaidApartments(): number {
    if (this.activeTab() === 'monthly') {
      return new Set(
        this.debts()
          .filter(d => {
            if (d.status !== 'Paid') return false;
            // Usar el período de la deuda, no la fecha de pago
            const debtDate = new Date(d.dueDate || d.createdAt);
            return debtDate.getMonth() + 1 === this.selectedMonth() &&
                   debtDate.getFullYear() === this.selectedYear();
          })
          .map(d => d.apartment)
      ).size;
    } else {
      return new Set(
        this.debts()
          .filter(d => {
            if (d.status !== 'Paid') return false;
            // Usar el período de la deuda, no la fecha de pago
            const debtDate = new Date(d.dueDate || d.createdAt);
            return debtDate.getFullYear() === this.selectedYear();
          })
          .map(d => d.apartment)
      ).size;
    }
  }
  
  getBalancePercentage(): number {
    const income = this.getTotalIncome();
    return income > 0 ? Math.round(((income - this.getTotalExpenses()) / income) * 100) : 0;
  }
  
  getOverduePercentage(): number {
    if (this.activeTab() === 'monthly') {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const monthlyDebts = this.debts().filter(d => {
        const debtDate = new Date(d.createdAt || d.dueDate);
        return debtDate.getMonth() + 1 === currentMonth && debtDate.getFullYear() === currentYear;
      });
      const overdueDebts = monthlyDebts.filter(d => d.status === 'Overdue');
      return monthlyDebts.length > 0 ? Math.round((overdueDebts.length / monthlyDebts.length) * 100) : 0;
    } else {
      const currentYear = new Date().getFullYear();
      const yearlyDebts = this.debts().filter(d => {
        const debtDate = new Date(d.createdAt || d.dueDate);
        return debtDate.getFullYear() === currentYear;
      });
      const overdueDebts = yearlyDebts.filter(d => d.status === 'Overdue');
      return yearlyDebts.length > 0 ? Math.round((overdueDebts.length / yearlyDebts.length) * 100) : 0;
    }
  }
  
  getTopDebtors() {
    const debtorMap = new Map();
    
    this.debts()
      .filter(d => d.status === 'Overdue')
      .forEach(debt => {
        const key = debt.apartment;
        if (debtorMap.has(key)) {
          const existing = debtorMap.get(key);
          existing.amount += (debt.amount || 0);
          existing.months += 1;
        } else {
          debtorMap.set(key, {
            apartment: debt.apartment,
            amount: (debt.amount || 0),
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

    const totalApartments = this.apartments().length || 100; // Default for demo
    const paidApartments = this.getPaidApartments();
    const overdueApartments = new Set(this.debts().filter(d => d.status === 'Overdue').map(d => d.apartment)).size;
    const pendingApartments = totalApartments - paidApartments - overdueApartments;
    
    const hasData = totalApartments > 0;
    const data = hasData ? [paidApartments, pendingApartments, overdueApartments] : [1];
    const labels = hasData ? 
      [`Al Día (${paidApartments})`, `Pendientes (${pendingApartments})`, `Morosos (${overdueApartments})`] : 
      ['Sin datos'];
    const colors = hasData ? ['#10b981', '#f59e0b', '#ef4444'] : ['#e5e7eb'];

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
            labels: { color: 'white', font: { size: 12 } }
          },
          tooltip: {
            enabled: hasData,
            callbacks: {
              label: function(context) {
                const percentage = ((context.parsed / totalApartments) * 100).toFixed(1);
                return `${context.label}: ${percentage}%`;
              }
            }
          }
        }
      }
    });
  }
  
  createExpenseChart() {
    const ctx = this.expenseChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Destruir gráfico existente si existe
    if (this.expenseChart) {
      this.expenseChart.destroy();
      this.expenseChart = null;
    }
    
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = 2025;
    
    const monthlyExpenses = this.expenses().filter(e => {
      const expenseDate = new Date(e.createdAt || e.date);
      return e.status?.code === 'paid' &&
             expenseDate.getMonth() + 1 === currentMonth &&
             expenseDate.getFullYear() === currentYear;
    });
    
    const categoryMap = new Map();
    monthlyExpenses.forEach(expense => {
      const category = expense.categoryName || 'Sin Categoría';
      const current = categoryMap.get(category) || 0;
      categoryMap.set(category, current + (expense.amount || 0));
    });
    
    const categories = Array.from(categoryMap.keys());
    const amounts = Array.from(categoryMap.values());
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16'];
    
    const hasData = amounts.length > 0 && amounts.some(a => a > 0);
    const chartData = hasData ? amounts : [1];
    const chartLabels = hasData ? categories : ['Sin gastos'];
    const chartColors = hasData ? colors.slice(0, categories.length) : ['#e5e7eb'];
    
    this.expenseChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: chartLabels,
        datasets: [{
          data: chartData,
          backgroundColor: chartColors,
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
            labels: { color: 'white', font: { size: 11 } }
          },
          tooltip: {
            enabled: hasData,
            callbacks: {
              label: function(context) {
                if (!hasData) return 'Sin datos';
                const total = amounts.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: $${context.parsed.toLocaleString()} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }
  
  createYearlyIncomeChart() {
    if (!this.yearlyIncomeChartRef) return;
    const ctx = this.yearlyIncomeChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const yearlyIncome = this.getMonthlyIncomeData();
    const yearlyExpenses = this.getMonthlyExpenseData();
    
    this.yearlyIncomeChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Ingresos Mensuales',
            data: yearlyIncome,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Gastos Mensuales',
            data: yearlyExpenses,
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
        plugins: { legend: { labels: { color: 'white' } } },
        scales: {
          x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
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
  
  getMonthlyExpenseData(): number[] {
    const monthlyData = [];
    
    for (let month = 1; month <= 12; month++) {
      const monthlyExpenses = this.expenses()
        .filter(e => {
          const expenseDate = new Date(e.createdAt || e.date);
          return e.status?.code === 'paid' &&
                 expenseDate.getMonth() + 1 === month &&
                 expenseDate.getFullYear() === this.selectedYear();
        })
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      monthlyData.push(monthlyExpenses);
    }
    
    return monthlyData;
  }
  
  createYearlyComparisonChart() {
    if (!this.yearlyComparisonChartRef) return;
    const ctx = this.yearlyComparisonChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    this.yearlyComparisonChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['2022', '2023', '2024'],
        datasets: [
          { label: 'Ingresos', data: [980000, 1050000, this.getYearlyIncome()], backgroundColor: '#10b981' },
          { label: 'Gastos', data: [520000, 540000, this.getYearlyExpenses()], backgroundColor: '#ef4444' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: 'white' } } },
        scales: {
          x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
          y: { beginAtZero: true, ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } }
        }
      }
    });
  }
  
  createQuarterlyMorosityChart() {
    if (!this.quarterlyMorosityChartRef) return;
    const ctx = this.quarterlyMorosityChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const quarterlyData = this.getQuarterlyMorosityData();
    
    this.quarterlyMorosityChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [{
          data: quarterlyData,
          backgroundColor: ['#f59e0b', '#ef4444', '#10b981', '#3b82f6']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: 'white' } } }
      }
    });
  }
  
  getQuarterlyMorosityData(): number[] {
    const currentYear = new Date().getFullYear();
    const quarters = [];
    
    for (let q = 1; q <= 4; q++) {
      const startMonth = (q - 1) * 3 + 1;
      const endMonth = q * 3;
      
      const quarterDebts = this.debts().filter(d => {
        const debtDate = new Date(d.createdAt || d.dueDate);
        const month = debtDate.getMonth() + 1;
        return debtDate.getFullYear() === currentYear && month >= startMonth && month <= endMonth;
      });
      
      const overdueDebts = quarterDebts.filter(d => d.status === 'Overdue');
      const percentage = quarterDebts.length > 0 ? Math.round((overdueDebts.length / quarterDebts.length) * 100) : 0;
      quarters.push(percentage);
    }
    
    return quarters;
  }
  
  createProjectionChart() {
    if (!this.projectionChartRef) return;
    const ctx = this.projectionChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const currentMonth = new Date().getMonth() + 1;
    const realData = this.getMonthlyIncomeData();
    const projectionData = this.getProjectionData(realData, currentMonth);
    
    this.projectionChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        datasets: [
          { 
            label: 'Real', 
            data: realData.map((value, index) => index < currentMonth ? value : null), 
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: false
          },
          { 
            label: 'Proyección', 
            data: projectionData, 
            borderColor: '#f59e0b', 
            borderDash: [5, 5],
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: 'white' } } },
        scales: {
          x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
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
  
  getProjectionData(realData: number[], currentMonth: number): (number | null)[] {
    const projection = new Array(12).fill(null);
    
    if (currentMonth > 1) {
      const avgIncome = realData.slice(0, currentMonth - 1).reduce((a, b) => a + b, 0) / (currentMonth - 1);
      
      for (let i = currentMonth - 1; i < 12; i++) {
        projection[i] = Math.round(avgIncome * (0.95 + Math.random() * 0.1)); // ±5% variation
      }
    }
    
    return projection;
  }
  
  logout(): void { this.authService.logout(); this.router.navigate(['/auth']); }
}