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
  @ViewChild('pieChart') pieChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('incomeChart') incomeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('blockChart') blockChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('complianceChart') complianceChartRef!: ElementRef<HTMLCanvasElement>;
  
  currentUser = signal<any>(null);
  debts = signal<any[]>([]);
  apartments = signal<any[]>([]);
  blocks = signal<any[]>([]);
  payments = signal<any[]>([]);
  selectedBlock = '';
  selectedApartment = '';
  selectedPeriod = 'all';
  filteredDebts = signal<any[]>([]);
  
  pieChart: Chart | null = null;
  incomeChart: Chart | null = null;
  blockChart: Chart | null = null;
  complianceChart: Chart | null = null;

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
    this.loadNotifications();
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
          this.debts.set(response.data);
          this.filteredDebts.set(response.data);
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
    this.createPieChart();
    this.createIncomeChart();
    this.createBlockChart();
    this.createComplianceChart();
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
          legend: { position: 'bottom' },
          tooltip: {
            enabled: hasData
          }
        }
      }
    });
  }

  createIncomeChart() {
    const ctx = this.incomeChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const monthlyData = this.getMonthlyData();
    const expectedIncome = 75000; // 36 apartamentos × $2,000 + 2 apartamentos × $1,000
    
    this.incomeChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: monthlyData.labels,
        datasets: [
          {
            label: 'Pagos Recibidos',
            data: monthlyData.paidAmounts,
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderColor: '#10b981',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#059669',
            pointRadius: 6,
            pointHoverRadius: 8
          },
          {
            label: 'Meta Mensual',
            data: new Array(12).fill(expectedIncome),
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            borderColor: '#2563eb',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: { 
            beginAtZero: true,
            max: 75000,
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
  }

  onBlockChange() {
    this.selectedApartment = '';
    this.applyFilters();
  }

  getFilteredApartments() {
    if (!this.selectedBlock) return this.apartments();
    return this.apartments().filter(apt => apt.blockName === this.selectedBlock);
  }

  applyFilters() {
    let filtered = this.debts();
    
    if (this.selectedBlock) {
      filtered = filtered.filter(debt => debt.apartment?.startsWith(this.selectedBlock));
    }
    
    if (this.selectedApartment) {
      filtered = filtered.filter(debt => debt.apartment?.includes(this.selectedApartment));
    }
    
    if (this.selectedPeriod !== 'all') {
      filtered = filtered.filter(debt => debt.year?.toString() === this.selectedPeriod);
    }
    
    this.filteredDebts.set(filtered);
    this.updateCharts();
  }

  updateCharts() {
    if (this.pieChart) {
      const pending = this.totalPending();
      const paid = this.totalPaid();
      const overdue = this.totalOverdue();
      
      const hasData = pending > 0 || paid > 0 || overdue > 0;
      this.pieChart.data.datasets[0].data = hasData ? [pending, paid, overdue] : [1];
      this.pieChart.data.labels = hasData ? ['Pendientes', 'Pagadas', 'Vencidas'] : ['Sin deudas registradas'];
      this.pieChart.data.datasets[0].backgroundColor = hasData ? ['#f59e0b', '#10b981', '#ef4444'] : ['#e5e7eb'];
      this.pieChart.options.plugins!.tooltip!.enabled = hasData;
      this.pieChart.update();
    }
    
    if (this.incomeChart) {
      const monthlyData = this.getMonthlyData();
      this.incomeChart.data.labels = monthlyData.labels;
      this.incomeChart.data.datasets[0].data = monthlyData.paidAmounts;
      this.incomeChart.update();
    }
    
    if (this.blockChart) {
      const blockData = this.getBlockDelinquencyData();
      this.blockChart.data.labels = blockData.labels;
      this.blockChart.data.datasets[0].data = blockData.overdueCount;
      this.blockChart.update();
    }
    
    if (this.complianceChart) {
      const morososData = this.getTopMorosos();
      const hasData = morososData.labels[0] !== 'Sin morosos' && morososData.counts.some(c => c > 0);
      this.complianceChart.data.labels = morososData.labels;
      this.complianceChart.data.datasets[0].data = morososData.counts;
      this.complianceChart.data.datasets[0].backgroundColor = hasData ? '#ef4444' : '#e5e7eb';
      this.complianceChart.update();
    }
  }

  getMonthlyData() {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const paidAmounts = new Array(12).fill(0);
    
    this.filteredDebts().forEach(debt => {
      if (debt.month >= 1 && debt.month <= 12 && debt.status === 'Paid') {
        paidAmounts[debt.month - 1] += debt.amount;
      }
    });
    
    return {
      labels: months,
      paidAmounts: paidAmounts
    };
  }

  totalPending() { 
    return this.filteredDebts().filter(d => d.status === 'Pending' || d.status === 'PaymentSubmitted').length;
  }
  totalPaid() { 
    return this.filteredDebts().filter(d => d.status === 'Paid').length;
  }
  totalOverdue() { 
    return this.filteredDebts().filter(d => d.status === 'Overdue').length;
  }
  
  totalPendingAmount() { return this.filteredDebts().filter(d => d.status === 'Pending').reduce((sum, d) => sum + d.amount, 0); }
  totalPaidAmount() { return this.filteredDebts().filter(d => d.status === 'Paid').reduce((sum, d) => sum + d.amount, 0); }
  totalOverdueAmount() { return this.filteredDebts().filter(d => d.status === 'Overdue').reduce((sum, d) => sum + d.amount, 0); }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'A';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  createBlockChart() {
    const ctx = this.blockChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const blockData = this.getBlockDelinquencyData();
    
    this.blockChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: blockData.labels,
        datasets: [{
          label: 'Deudas Vencidas',
          data: blockData.overdueCount,
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
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
          y: { 
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    });
  }

  createComplianceChart() {
    const ctx = this.complianceChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const morososData = this.getTopMorosos();
    const hasData = morososData.labels[0] !== 'Sin morosos';
    
    this.complianceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: morososData.labels,
        datasets: [{
          label: 'Morosidad (%)',
          data: morososData.counts,
          backgroundColor: hasData ? '#ef4444' : '#e5e7eb',
          borderWidth: 1,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: hasData }
        },
        scales: {
          x: { 
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    });
  }

  getBlockDelinquencyData() {
    const blockNames = this.blocks().map(block => block.name);
    const overdueCount = blockNames.map(blockName => {
      return this.filteredDebts().filter(debt => 
        debt.apartment?.startsWith(blockName) && debt.status === 'Overdue'
      ).length;
    });
    
    return {
      labels: blockNames,
      overdueCount: overdueCount
    };
  }

  getTopMorosos() {
    const apartmentOverdue: { [key: string]: number } = {};
    
    // Contar deudas vencidas por apartamento
    this.filteredDebts().forEach(debt => {
      if (debt.status === 'Overdue' && debt.apartment) {
        apartmentOverdue[debt.apartment] = (apartmentOverdue[debt.apartment] || 0) + 1;
      }
    });
    
    // Calcular porcentajes basado en 12 meses y filtrar solo los que tienen morosidad
    const morososArray = Object.entries(apartmentOverdue)
      .filter(([apt, count]) => count > 0)
      .map(([apt, count]) => ({
        apartment: apt,
        percentage: Math.round((count / 12) * 100)
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10);
    
    // Si no hay morosos, mostrar mensaje
    if (morososArray.length === 0) {
      return {
        labels: ['Sin morosos'],
        counts: [0]
      };
    }
    
    return {
      labels: morososArray.map(item => item.apartment),
      counts: morososArray.map(item => item.percentage)
    };
  }

  navigateToHome(): void { this.router.navigate(['/welcome']); }
  navigateToDebtManagement(): void { this.router.navigate(['/debt-management']); }
  navigateToPaymentsByStatus(status: string): void { this.router.navigate(['/payment-management'], { queryParams: { status: status } }); }
  navigateToAnnouncements(): void { 
    console.log('Botón clickeado - Navegando a gestión de anuncios...');
    this.router.navigate(['/announcement-management']).then(success => {
      console.log('Navegación exitosa:', success);
    }).catch(error => {
      console.error('Error en navegación:', error);
    });
  }
  
  getPaymentsInReview(): number {
    // Contar deudas con estado PaymentSubmitted (pagos pendientes de aprobación)
    return this.filteredDebts().filter(d => d.status === 'PaymentSubmitted').length;
  }
  
  getTotalRequirePayment(): number {
    // Solo contar Pending y Overdue, excluyendo PaymentSubmitted
    return this.filteredDebts().filter(d => d.status === 'Pending' || d.status === 'Overdue').length;
  }
  
  async loadNotifications() {
    try {
      await this.notificationService.startConnection();
      console.log('[DASHBOARD] Notificaciones inicializadas');
    } catch (error) {
      console.error('[DASHBOARD] Error inicializando notificaciones:', error);
    }
  }
  
  logout(): void { this.authService.logout(); this.router.navigate(['/auth']); }
}