import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../core/services/auth.service';
import { DebtService } from '../../core/services/debt.service';
import { PaymentService } from '../../core/services/payment.service';
import { AnnouncementService } from '../../core/services/announcement.service';
import { NavbarComponent } from '../../shared/components/navbar.component';

Chart.register(...registerables);

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FormsModule],
  templateUrl: './owner-dashboard.component.html',
  styleUrls: ['./owner-dashboard.component.scss']
})
export class OwnerDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('pieChart') pieChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChart') lineChartRef!: ElementRef<HTMLCanvasElement>;
  currentUser = signal<any>(null);
  loading = signal(false);
  totalRequirePayment = signal(0);
  totalInReview = signal(0);
  totalPaid = signal(0);
  recentPayments = signal<any[]>([]);
  allDebts = signal<any[]>([]);
  allPayments = signal<any[]>([]);
  apartmentInfo = signal<any>(null);
  announcements = signal<any[]>([]);
  selectedYear = new Date().getFullYear();
  availableYears: number[] = [];
  
  pieChart: Chart | null = null;
  lineChart: Chart | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private debtService: DebtService,
    private paymentService: PaymentService,
    private announcementService: AnnouncementService
  ) {}

  ngOnInit() {
    this.currentUser.set(this.authService.currentUser());
    this.initializeYears(); // Inicializar años antes de cargar datos
    this.loadDashboardData();
    
    // Escuchar cambios de ruta para recargar datos
    this.router.events.subscribe(event => {
      if (event.constructor.name === 'NavigationEnd') {
        this.loadDashboardData();
      }
    });
  }

  ngAfterViewInit() {
    // Las gráficas se inicializarán después de cargar los datos
  }

  async loadDashboardData() {
    const user = this.currentUser();
    if (!user?.ownerId) return;
    
    this.loading.set(true);
    
    try {
      // Cargar deudas
      const debtsResponse = await this.debtService.getDebts(user.ownerId).toPromise();
      if (debtsResponse?.success) {
        this.processDebtsData(debtsResponse.data);
      }
      
      // Cargar pagos
      const paymentsResponse = await this.paymentService.getPayments(user.ownerId).toPromise();
      if (paymentsResponse?.success) {
        const payments = paymentsResponse.data || [];
        this.allPayments.set(payments);
        this.recentPayments.set(payments.slice(0, 5));
        this.updateCharts();
      }
      
      // Cargar anuncios
      this.loadAnnouncements();
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      this.loading.set(false);
    }
  }

  processDebtsData(data: any) {
    const currentDebts = data.currentDebts || [];
    const overdueDebts = data.overdueDebts || [];
    const paidDebts = data.paidDebts || [];
    const paymentSubmittedDebts = data.paymentSubmittedDebts || [];
    
    // Combinar todas las deudas para los gráficos
    const allDebts = [...currentDebts, ...overdueDebts, ...paidDebts, ...paymentSubmittedDebts];
    this.allDebts.set(allDebts);
    
    // Calcular años disponibles basados en las deudas
    this.calculateAvailableYears(allDebts);
    
    // Usar las categorías del backend que ya están correctas
    this.totalRequirePayment.set(currentDebts.length + overdueDebts.length);
    this.totalInReview.set(paymentSubmittedDebts.length);
    this.totalPaid.set(paidDebts.length);
    
    // Inicializar o actualizar gráficas después de procesar datos
    if (!this.pieChart || !this.lineChart) {
      // Primera vez - crear las gráficas
      setTimeout(() => this.initCharts(), 100);
    } else {
      // Ya existen - solo actualizar
      this.updateCharts();
    }
  }

  calculateAvailableYears(debts: any[]) {
    const currentYear = new Date().getFullYear();
    
    if (debts.length === 0) {
      // Si no hay deudas, solo mostrar el año actual
      this.availableYears = [currentYear];
      this.selectedYear = currentYear;
      return;
    }
    
    // Obtener años únicos de las deudas (solo hasta el año actual)
    const years = [...new Set(debts.map(d => d.year))].filter(y => y != null && y <= currentYear);
    
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

  navigateToHome(): void {
    this.router.navigate(['/welcome']);
  }

  navigateToDebts(): void {
    this.router.navigate(['/my-debts']);
  }

  navigateToPayments(): void {
    this.router.navigate(['/my-payments']);
  }

  navigateToPaymentsByStatus(status: string): void {
    this.router.navigate(['/my-payments'], { queryParams: { status: status } });
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

  initializeYears() {
    const currentYear = new Date().getFullYear();
    // Inicializar solo con el año actual
    // calculateAvailableYears() se encargará de agregar años históricos basados en las deudas reales
    this.availableYears = [currentYear];
    this.selectedYear = currentYear;
  }

  onYearChange() {
    console.log('📅 onYearChange - Año seleccionado:', this.selectedYear);
    this.updateCharts();
  }

  onYearChangeEvent(event: any) {
    this.selectedYear = parseInt(event.target.value);
    console.log('📅 onYearChangeEvent - Nuevo año:', this.selectedYear);
    this.onYearChange();
  }

  initCharts() {
    this.createPieChart();
    this.createLineChart();
  }

  createPieChart() {
    const ctx = this.pieChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    // Filtrar deudas por el año seleccionado
    const selectedYearNum = this.selectedYear;
    const debtsForYear = this.allDebts().filter(debt => debt.year === selectedYearNum);
    
    // Contar por estado solo las deudas del año seleccionado
    const requirePayment = debtsForYear.filter(d => d.status === 'Pending' || d.status === 'Overdue').length;
    const inReview = debtsForYear.filter(d => d.status === 'PaymentSubmitted').length;
    const paid = debtsForYear.filter(d => d.status === 'Paid').length;
    
    const hasData = requirePayment > 0 || inReview > 0 || paid > 0;
    const data = hasData ? [requirePayment, inReview, paid] : [1];
    const labels = hasData ? ['Requieren Pago', 'En Revisión', 'Pagadas'] : ['Sin deudas registradas'];
    const colors = hasData ? ['#ef4444', '#f59e0b', '#10b981'] : ['#e5e7eb'];

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

  createLineChart() {
    const ctx = this.lineChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const complianceData = this.getMonthlyCompliance();
    
    this.lineChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: complianceData.labels,
        datasets: [{
          label: 'Estado del Mes',
          data: complianceData.status,
          backgroundColor: complianceData.status.map(status => {
            if (status === 1) return '#10b981';
            if (status === 0.5) return '#f59e0b';
            if (status === 0.1) return '#ef4444';
            return '#e5e7eb';
          }),
          borderWidth: 1,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.parsed.y;
                if (value === 1) return 'Pagado ✓';
                if (value === 0.5) return 'En Revisión ⏳';
                if (value === 0.1) return 'Requiere Pago ✗';
                return 'Sin Deuda';
              }
            }
          }
        },
        scales: {
          y: { 
            beginAtZero: true,
            max: 1,
            ticks: {
              stepSize: 0.1,
              callback: function(value) {
                if (value === 1) return 'Pagado';
                if (value === 0.5) return 'En Revisión';
                if (value === 0.1) return 'Requiere Pago';
                if (value === 0) return '';
                return '';
              }
            }
          }
        }
      }
    });
  }

  getMonthlyCompliance() {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const status = new Array(12).fill(0);
    
    // Filtrar deudas por el año seleccionado
    const selectedYearNum = this.selectedYear;
    const debtsForYear = this.allDebts().filter(debt => debt.year === selectedYearNum);
    
    debtsForYear.forEach(debt => {
      if (debt.month >= 1 && debt.month <= 12) {
        const monthIndex = debt.month - 1;
        
        if (debt.status === 'Paid') {
          status[monthIndex] = 1; // Pagado
        } else if (debt.status === 'PaymentSubmitted') {
          status[monthIndex] = 0.5; // En Revisión
        } else if (debt.status === 'Pending' || debt.status === 'Overdue') {
          status[monthIndex] = 0.1; // Requiere Pago (valor mínimo para visualizar)
        }
      }
    });
    
    return {
      labels: months,
      status: status
    };
  }

  updateCharts() {
    if (this.pieChart) {
      // Filtrar deudas por el año seleccionado
      const selectedYearNum = this.selectedYear;
      const debtsForYear = this.allDebts().filter(debt => debt.year === selectedYearNum);
      
      // Contar por estado solo las deudas del año seleccionado
      const requirePayment = debtsForYear.filter(d => d.status === 'Pending' || d.status === 'Overdue').length;
      const inReview = debtsForYear.filter(d => d.status === 'PaymentSubmitted').length;
      const paid = debtsForYear.filter(d => d.status === 'Paid').length;
      
      const hasData = requirePayment > 0 || inReview > 0 || paid > 0;
      this.pieChart.data.datasets[0].data = hasData ? [requirePayment, inReview, paid] : [1];
      this.pieChart.data.labels = hasData ? ['Requieren Pago', 'En Revisión', 'Pagadas'] : ['Sin deudas registradas'];
      this.pieChart.data.datasets[0].backgroundColor = hasData ? ['#ef4444', '#f59e0b', '#10b981'] : ['#e5e7eb'];
      this.pieChart.options.plugins!.tooltip!.enabled = hasData;
      this.pieChart.update();
    }
    
    if (this.lineChart) {
      const complianceData = this.getMonthlyCompliance();
      this.lineChart.data.labels = complianceData.labels;
      this.lineChart.data.datasets[0].data = complianceData.status;
      this.lineChart.data.datasets[0].backgroundColor = complianceData.status.map(status => {
        if (status === 1) return '#10b981';
        if (status === 0.5) return '#f59e0b';
        if (status === 0.1) return '#ef4444';
        return '#e5e7eb';
      });
      this.lineChart.update();
    }
  }

  getMonthlyAmount(): string {
    const user = this.currentUser();
    if (!user?.apartmentNumber) return '2,000';
    
    // Apartamentos 501 (P y O) pagan $1,000, el resto $2,000
    const isRoofApartment = user.apartmentNumber.includes('501');
    return isRoofApartment ? '1,000' : '2,000';
  }

  getExpectedMonthlyAmount(): number {
    const user = this.currentUser();
    if (!user?.apartmentNumber) return 2000;
    
    // Apartamentos 501 (P y O) pagan $1,000, el resto $2,000
    const isRoofApartment = user.apartmentNumber.includes('501');
    return isRoofApartment ? 1000 : 2000;
  }

  loadAnnouncements() {
    this.announcementService.getAnnouncements().subscribe({
      next: (response) => {
        if (response.success) {
          this.announcements.set(response.data || []);
        }
      },
      error: (error) => {
        console.error('Error cargando anuncios:', error);
        this.announcements.set([]);
      }
    });
  }

  viewAnnouncement(announcement: any) {
    console.log('Abriendo anuncio:', announcement.title);
    
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 2rem;';
    
    // Crear modal
    const modal = document.createElement('div');
    modal.style.cssText = 'background: white; border-radius: 12px; max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);';
    
    modal.innerHTML = `
      <div style="padding: 2rem; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
        <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600; color: #1f2937;">${announcement.title}</h2>
        <button id="closeModal" style="background: #f3f4f6; border: none; width: 2rem; height: 2rem; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem;">
          ×
        </button>
      </div>
      <div style="padding: 2rem;">
        ${announcement.isUrgent ? '<div style="background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;"><span style="font-weight: bold;">⚠️ ANUNCIO URGENTE</span></div>' : ''}
        <p style="color: #374151; line-height: 1.6; margin: 0 0 1.5rem 0; white-space: pre-wrap;">${announcement.content}</p>
        <div style="color: #6b7280; font-size: 0.875rem; border-top: 1px solid #f1f5f9; padding-top: 1rem;">
          <strong>Fecha:</strong> ${new Date(announcement.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}<br>
          <strong>Publicado por:</strong> Administración del Condominio
        </div>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Cerrar modal
    const closeModal = () => {
      document.body.removeChild(overlay);
    };
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    
    modal.querySelector('#closeModal')?.addEventListener('click', closeModal);
  }

  navigateToAnnouncements() {
    this.router.navigate(['/announcements']);
  }

  navigateToAnnouncementManagement() {
    this.router.navigate(['/announcement-management']);
  }
}