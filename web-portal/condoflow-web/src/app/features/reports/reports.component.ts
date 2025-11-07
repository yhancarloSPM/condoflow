import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AdminDebtService } from '../../core/services/admin-debt.service';
import { AdminPaymentService } from '../../core/services/admin-payment.service';
import { NavbarComponent } from '../../shared/components/navbar.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <div class="reports-layout">
      <app-navbar></app-navbar>

      <div class="main-content">
        <div class="page-header">
          <h1>Reportes</h1>
          <p>Genera y descarga reportes del condominio</p>
        </div>

        <div class="reports-grid">
          <div class="report-card" (click)="generateMorosityReport()">
            <div class="report-icon overdue">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
            <div class="report-info">
              <h3>Reporte de Morosidad</h3>
              <p>Propietarios con deudas vencidas</p>
              <span class="report-count">{{ overdueCount() }} propietarios</span>
            </div>
            <div class="report-action">
              <i class="pi pi-download"></i>
            </div>
          </div>

          <div class="report-card" (click)="generateFinancialReport()">
            <div class="report-icon financial">
              <i class="pi pi-chart-line"></i>
            </div>
            <div class="report-info">
              <h3>Reporte Financiero</h3>
              <p>Ingresos vs deudas pendientes</p>
              <span class="report-count">Mensual</span>
            </div>
            <div class="report-action">
              <i class="pi pi-download"></i>
            </div>
          </div>

          <div class="report-card" (click)="generatePaymentsReport()">
            <div class="report-icon payments">
              <i class="pi pi-credit-card"></i>
            </div>
            <div class="report-info">
              <h3>Reporte de Pagos</h3>
              <p>Historial detallado de pagos</p>
              <span class="report-count">{{ paymentsCount() }} pagos</span>
            </div>
            <div class="report-action">
              <i class="pi pi-download"></i>
            </div>
          </div>

          <div class="report-card" (click)="generateOwnersReport()">
            <div class="report-icon owners">
              <i class="pi pi-users"></i>
            </div>
            <div class="report-info">
              <h3>Reporte de Propietarios</h3>
              <p>Estado general de apartamentos</p>
              <span class="report-count">{{ ownersCount() }} propietarios</span>
            </div>
            <div class="report-action">
              <i class="pi pi-download"></i>
            </div>
          </div>
        </div>

        @if (loading()) {
          <div class="loading-overlay">
            <div class="loading-content">
              <div class="spinner"></div>
              <p>Generando reporte...</p>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .reports-layout { min-height: 100vh; background: #f8fafc; }
    .main-content { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .page-header h1 { font-size: 2rem; font-weight: 700; color: #1f2937; margin: 0 0 0.5rem 0; }
    .page-header p { color: #6b7280; margin: 0 0 2rem 0; }
    
    .reports-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
    .report-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 2rem; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 1.5rem; }
    .report-card:hover { border-color: #2563EB; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15); transform: translateY(-2px); }
    
    .report-icon { width: 3.5rem; height: 3.5rem; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: white; }
    .report-icon.overdue { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .report-icon.financial { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
    .report-icon.payments { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .report-icon.owners { background: linear-gradient(135deg, #10b981, #059669); }
    
    .report-info { flex: 1; }
    .report-info h3 { font-size: 1.125rem; font-weight: 600; color: #1f2937; margin: 0 0 0.5rem 0; }
    .report-info p { color: #6b7280; margin: 0 0 0.5rem 0; font-size: 0.875rem; }
    .report-count { color: #2563EB; font-weight: 600; font-size: 0.875rem; }
    
    .report-action { color: #6b7280; font-size: 1.25rem; }
    .report-card:hover .report-action { color: #2563EB; }
    
    .loading-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .loading-content { background: white; border-radius: 12px; padding: 2rem; text-align: center; }
    .spinner { width: 2rem; height: 2rem; border: 2px solid #e5e7eb; border-top: 2px solid #2563EB; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem auto; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `]
})
export class ReportsComponent implements OnInit {
  currentUser = signal<any>(null);
  loading = signal(false);
  debts = signal<any[]>([]);
  payments = signal<any[]>([]);

  constructor(
    private authService: AuthService,
    private router: Router,
    private adminDebtService: AdminDebtService,
    private adminPaymentService: AdminPaymentService
  ) {}

  ngOnInit() {
    this.currentUser.set(this.authService.currentUser());
    this.loadData();
  }

  loadData() {
    this.adminDebtService.getAllDebts().subscribe({
      next: (response) => {
        if (response.success) {
          this.debts.set(response.data);
        }
      }
    });

    this.adminPaymentService.getAllPayments().subscribe({
      next: (response) => {
        if (response.success) {
          this.payments.set(response.data);
        }
      }
    });
  }

  overdueCount() { return this.debts().filter(d => d.Status === 'Overdue').length; }
  paymentsCount() { return this.payments().length; }
  ownersCount() { return new Set(this.debts().map(d => d.OwnerId)).size; }

  generateMorosityReport() {
    this.loading.set(true);
    setTimeout(() => {
      const overdueDebts = this.debts().filter(d => d.Status === 'Overdue');
      this.downloadCSV(overdueDebts, 'reporte-morosidad.csv');
      this.loading.set(false);
    }, 1000);
  }

  generateFinancialReport() {
    this.loading.set(true);
    setTimeout(() => {
      const financialData = this.debts().map(d => ({
        Mes: d.Month,
        Año: d.Year,
        Monto: d.Amount,
        Estado: d.Status,
        Propietario: d.OwnerName
      }));
      this.downloadCSV(financialData, 'reporte-financiero.csv');
      this.loading.set(false);
    }, 1000);
  }

  generatePaymentsReport() {
    this.loading.set(true);
    setTimeout(() => {
      this.downloadCSV(this.payments(), 'reporte-pagos.csv');
      this.loading.set(false);
    }, 1000);
  }

  generateOwnersReport() {
    this.loading.set(true);
    setTimeout(() => {
      const ownersData = this.debts().map(d => ({
        Propietario: d.OwnerName,
        Apartamento: d.Apartment,
        TotalDeudas: d.Amount,
        Estado: d.Status
      }));
      this.downloadCSV(ownersData, 'reporte-propietarios.csv');
      this.loading.set(false);
    }, 1000);
  }

  downloadCSV(data: any[], filename: string) {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'A';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  navigateToHome(): void { this.router.navigate(['/welcome']); }
  logout(): void { this.authService.logout(); this.router.navigate(['/auth']); }
}