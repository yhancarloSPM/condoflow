import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { DebtService } from '../../core/services/debt.service';
import { AdminDebtService } from '../../core/services/admin-debt.service';
import { environment } from '../../../environments/environment';
import { NavbarComponent } from '../../shared/components/navbar.component';

@Component({
  selector: 'app-debt-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <div class="debt-layout">
      <app-navbar></app-navbar>

      <div class="main-content">
        <div class="page-header">
          <h1>Gestión de Deudas</h1>
          <p>Monitorear y administrar deudas de todos los propietarios</p>
        </div>

        <!-- Resumen de deudas -->
        <div class="summary-cards">
          <div class="summary-card">
            <div class="summary-icon pending">
              <i class="pi pi-clock"></i>
            </div>
            <div class="summary-info">
              <h3>{{ totalPendingDebts() }}</h3>
              <p>Deudas Pendientes</p>
              <small>\${{ totalPendingAmount().toFixed(2) }}</small>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon overdue">
              <i class="pi pi-times"></i>
            </div>
            <div class="summary-info">
              <h3>{{ totalOverdueDebts() }}</h3>
              <p>Deudas Vencidas</p>
              <small>\${{ totalOverdueAmount().toFixed(2) }}</small>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon total">
              <i class="pi pi-users"></i>
            </div>
            <div class="summary-info">
              <h3>{{ getOwnersSummary().length }}</h3>
              <p>Propietarios con Deudas</p>
              <small>\${{ totalActiveAmount().toFixed(2) }} total</small>
            </div>
          </div>
        </div>

        <!-- Filtros y búsqueda -->
        <div class="filters-card">
          <div class="filters-row">
            <div class="search-box">
              <i class="pi pi-search"></i>
              <input type="text" placeholder="Buscar por propietario..." [(ngModel)]="searchTerm" (input)="updateFilters()" class="search-input">
            </div>
            <select [(ngModel)]="selectedBlock" (change)="onBlockChange()" class="filter-select">
              <option value="">Todos los bloques</option>
              @for (block of blocks(); track block.id) {
                <option [value]="block.name">Bloque {{ block.name }}</option>
              }
            </select>
            <select [(ngModel)]="selectedApartment" (change)="updateFilters()" class="filter-select">
              <option value="">Todos los apartamentos</option>
              @for (apt of getFilteredApartments(); track apt.id) {
                <option [value]="apt.number">{{ apt.number }}</option>
              }
            </select>
            <select [(ngModel)]="sortBy" (change)="updateFilters()" class="filter-select">
              <option value="dueDate">Por vencimiento</option>
              <option value="amount">Por monto</option>
              <option value="owner">Por propietario</option>
            </select>
          </div>
        </div>

        <!-- Totales por propietario -->
        <div class="owners-summary-card">
          <div class="owners-header">
            <h3>Propietarios con Mayor Deuda</h3>
            @if (getOwnersSummary().length > 4) {
              <button class="btn-link" (click)="toggleShowAllOwners()">
                {{ showAllOwners() ? 'Ver menos' : 'Ver todos (' + getOwnersSummary().length + ')' }}
              </button>
            }
          </div>
          @if (getOwnersSummary().length === 0) {
            <div class="empty-state">
              <p>No hay deudas activas para mostrar</p>
            </div>
          } @else {
            <div class="owners-grid">
              @for (owner of getDisplayedOwners(); track owner.name) {
                <div class="owner-summary-item">
                  <div class="owner-info">
                    <h4>{{ owner.name }}</h4>
                    <p>{{ owner.apartment }}</p>
                  </div>
                  <div class="owner-debts">
                    @if (owner.pendingAmount > 0) {
                      <div class="debt-type pending">
                        <span class="label">Pendientes:</span>
                        <span class="amount">\${{ owner.pendingAmount.toFixed(2) }}</span>
                      </div>
                    }
                    @if (owner.overdueAmount > 0) {
                      <div class="debt-type overdue">
                        <span class="label">Vencidas:</span>
                        <span class="amount">\${{ owner.overdueAmount.toFixed(2) }}</span>
                      </div>
                    }
                    <div class="debt-total">
                      <span class="label">Total:</span>
                      <span class="amount total">\${{ owner.totalAmount.toFixed(2) }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Lista de deudas activas -->
        <div class="debts-list-card">
          <h3>Deudas Activas (Pendientes y Vencidas)</h3>
          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Cargando deudas...</p>
            </div>
          } @else if (allDebts().length === 0) {
            <div class="empty-state">
              <i class="pi pi-file"></i>
              <p>No hay deudas registradas</p>
            </div>
          } @else {
            <div class="debts-list">
              @for (debt of paginatedDebts(); track debt.id) {
                <div class="debt-item" [class]="debt.status.toLowerCase()">
                  @if (debt.status === 'Pending') {
                    <div class="status-indicator pending">
                      <i class="pi pi-clock"></i>
                      <span>PENDIENTE</span>
                    </div>
                  } @else if (debt.status === 'Paid') {
                    <div class="status-indicator approved">
                      <i class="pi pi-check"></i>
                      <span>PAGADA</span>
                    </div>
                  } @else if (debt.status === 'Overdue') {
                    <div class="status-indicator rejected">
                      <i class="pi pi-times"></i>
                      <span>VENCIDA</span>
                    </div>
                  }
                  <div class="debt-info">
                    <h4>{{ debt.ownerName }}</h4>
                    <p class="debt-details">{{ debt.apartment }} - {{ debt.concept }}</p>
                    <p class="debt-period">{{ getMonthName(debt.month) }} {{ debt.year }}</p>
                  </div>
                  <div class="debt-meta">
                    <small class="debt-due">Vence: {{ debt.dueDate | date:'dd/MM/yyyy' }}</small>
                  </div>
                  <div class="debt-fixed-right">
                    <div class="debt-details-section">
                      <div class="debt-amount">
                        {{ '$' + debt.amount?.toFixed(2) }}
                        <small>DOP</small>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
            
            <!-- Paginación -->
            @if (totalPages() > 1) {
              <div class="pagination-container">
                <div class="pagination-info">
                  <span>Mostrando {{ (currentPage() - 1) * pageSize + 1 }} - {{ Math.min(currentPage() * pageSize, filteredDebts().length) }} de {{ filteredDebts().length }} deudas</span>
                </div>
                <div class="pagination">
                  <button class="pagination-btn" [disabled]="currentPage() === 1" (click)="prevPage()">
                    <i class="pi pi-chevron-left"></i>
                  </button>
                  @for (page of getPageNumbers(); track page) {
                    @if (page === '...') {
                      <span class="pagination-dots">...</span>
                    } @else {
                      <button class="pagination-btn" [class.active]="page === currentPage()" (click)="goToPage($any(page))">
                        {{ page }}
                      </button>
                    }
                  }
                  <button class="pagination-btn" [disabled]="currentPage() === totalPages()" (click)="nextPage()">
                    <i class="pi pi-chevron-right"></i>
                  </button>
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .debt-layout { min-height: 100vh; background: #f8fafc; }
    .main-content { max-width: 1400px; margin: 0 auto; padding: 2rem; }
    .page-header h1 { font-size: 2rem; font-weight: 700; color: #1f2937; margin: 0 0 0.5rem 0; }
    .page-header p { color: #6b7280; margin: 0 0 2rem 0; }
    .debt-form-card { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
    .debt-form-card h3 { margin: 0 0 1.5rem 0; font-size: 1.25rem; font-weight: 600; color: #1f2937; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-weight: 500; color: #374151; margin-bottom: 0.5rem; font-size: 0.875rem; }
    .form-control { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; transition: border-color 0.2s ease; }
    .form-control:focus { outline: none; border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
    .btn { padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 0.5rem; border: none; }
    .btn-primary { background: #2563EB; color: white; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinner-sm { width: 1rem; height: 1rem; border: 2px solid transparent; border-top: 2px solid currentColor; border-radius: 50%; animation: spin 1s linear infinite; }
    
    /* Filters */
    .filters-card { background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
    .filters-row { display: flex; gap: 1rem; align-items: center; }
    .search-box { position: relative; flex: 1; }
    .search-box i { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #6b7280; }
    .search-input { width: 100%; padding: 0.5rem 0.75rem 0.5rem 2.5rem; border: 1px solid #d1d5db; border-radius: 6px; }
    .filter-select { padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; background: white; }
    
    /* Summary Cards */
    .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .summary-card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; display: flex; align-items: center; gap: 1rem; }
    .summary-icon { width: 3rem; height: 3rem; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; color: white; }
    .summary-icon.pending { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .summary-icon.overdue { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .summary-icon.total { background: linear-gradient(135deg, #6366f1, #4f46e5); }
    .stat-info small { color: #2563EB; font-weight: 600; }
    .summary-info h3 { font-size: 1.5rem; font-weight: 700; color: #1f2937; margin: 0; }
    .summary-info p { color: #6b7280; margin: 0; font-size: 0.875rem; }
    
    /* Debts List */
    .debts-list-card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
    .debts-list-card h3 { margin: 0 0 1.5rem 0; font-size: 1.25rem; font-weight: 600; color: #1f2937; }
    .debts-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .debt-item { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; transition: all 0.2s ease; background: white; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); position: relative; }
    .debt-item:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
    .debt-item.pending { border-left: 4px solid #f59e0b; }
    .debt-item.overdue { border-left: 4px solid #ef4444; }
    .debt-item.paid { border-left: 4px solid #10B981; }
    
    .status-indicator { position: absolute; top: -8px; right: 1rem; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 0.25rem; }
    .status-indicator.pending { background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3); animation: pulse 2s infinite; }
    .status-indicator.approved { background: #10B981; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3); }
    .status-indicator.rejected { background: #ef4444; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3); }
    
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }
    
    .debt-info { position: relative; padding-bottom: 1rem; flex: 1; }
    .debt-info h4 { font-size: 1rem; font-weight: 600; color: #1f2937; margin: 0 0 0.25rem 0; }
    .debt-details { color: #6b7280; margin: 0 0 0.25rem 0; font-size: 0.875rem; }
    .debt-period { color: #4b5563; font-size: 0.875rem; margin: 0.25rem 0; }
    
    .debt-fixed-right { display: flex; flex-direction: column; align-items: flex-end; gap: 1rem; align-self: flex-start; width: 250px; flex-shrink: 0; }
    .debt-details-section { display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; text-align: right; }
    .debt-amount { font-size: 1.5rem; font-weight: 700; color: #1f2937; font-family: 'Segoe UI', system-ui, sans-serif; letter-spacing: -0.025em; display: flex; align-items: baseline; gap: 0.5rem; }
    .debt-amount small { font-size: 0.75rem; font-weight: 600; color: #6b7280; background: #f8fafc; padding: 0.25rem 0.5rem; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .debt-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 1rem; gap: 1rem; position: relative; width: 100%; min-height: 2rem; flex-basis: 100%; order: 2; }
    .debt-due { color: #9ca3af; flex: 1; }
    .loading-state, .empty-state { text-align: center; padding: 3rem 1rem; color: #6b7280; }
    .spinner { width: 2rem; height: 2rem; border: 2px solid #e5e7eb; border-top: 2px solid #2563EB; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem auto; }
    .empty-state i { font-size: 3rem; margin-bottom: 1rem; color: #d1d5db; }
    
    /* Paginación */
    .pagination-container { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-top: 1px solid #e5e7eb; }
    .pagination { display: flex; gap: 0.5rem; }
    .pagination-btn { padding: 0.5rem 0.75rem; border: 1px solid #e5e7eb; background: white; color: #6b7280; border-radius: 6px; cursor: pointer; }
    .pagination-btn:hover:not(:disabled) { border-color: #2563EB; color: #2563EB; }
    .pagination-btn.active { background: #2563EB; color: white; border-color: #2563EB; }
    .pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .pagination-dots { padding: 0.5rem 0.75rem; color: #6b7280; font-weight: 500; }
    
    /* Owners Summary */
    .owners-summary-card { background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
    .owners-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .owners-header h3 { margin: 0; font-size: 1.25rem; font-weight: 600; color: #1f2937; }
    .btn-link { background: none; border: none; color: #2563EB; cursor: pointer; font-size: 0.875rem; text-decoration: underline; }
    .btn-link:hover { color: #1d4ed8; }
    .owners-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
    .owner-summary-item { padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb; }
    .owner-info h4 { margin: 0 0 0.25rem 0; font-size: 1rem; font-weight: 600; color: #1f2937; }
    .owner-info p { margin: 0; color: #6b7280; font-size: 0.875rem; }
    .owner-debts { margin-top: 0.75rem; }
    .debt-type { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .debt-type.pending .amount { color: #f59e0b; font-weight: 600; }
    .debt-type.overdue .amount { color: #ef4444; font-weight: 600; }
    .debt-total { display: flex; justify-content: space-between; align-items: center; padding-top: 0.5rem; border-top: 1px solid #e5e7eb; font-weight: 600; }
    .debt-total .amount.total { color: #1f2937; font-size: 1.1rem; }
    .debt-type .label, .debt-total .label { color: #6b7280; font-size: 0.875rem; }
    
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `]
})
export class DebtManagementComponent implements OnInit {
  currentUser = signal<any>(null);
  loading = signal(false);
  allDebts = signal<any[]>([]);
  apartments = signal<any[]>([]);
  blocks = signal<any[]>([]);
  searchTerm = '';
  selectedBlock = '';
  selectedApartment = '';
  sortBy = 'dueDate';
  currentPage = signal(1);
  pageSize = 10;
  showAllOwners = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
    private debtService: DebtService,
    private adminDebtService: AdminDebtService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.currentUser.set(this.authService.currentUser());
    this.loadAllDebts();
    this.loadBlocks();
    this.loadApartments();
  }



  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'A';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  navigateToHome(): void {
    this.router.navigate(['/welcome']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }

  loadAllDebts() {
    this.loading.set(true);
    this.adminDebtService.getAllDebts().subscribe({
      next: (response) => {
        if (response.success) {
          this.allDebts.set(response.data);
          this.updateFilters(); // Inicializar filtros
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando deudas:', error);
        this.loading.set(false);
      }
    });
  }

  totalPendingDebts() {
    return this.filteredDebts().filter(d => d.status === 'Pending').length;
  }

  totalOverdueDebts() {
    return this.filteredDebts().filter(d => d.status === 'Overdue').length;
  }

  totalActiveDebts() {
    return this.filteredDebts().filter(d => d.status === 'Pending' || d.status === 'Overdue').length;
  }

  totalPendingAmount() {
    return this.filteredDebts().filter(d => d.status === 'Pending').reduce((sum, d) => sum + d.amount, 0);
  }

  totalOverdueAmount() {
    return this.filteredDebts().filter(d => d.status === 'Overdue').reduce((sum, d) => sum + d.amount, 0);
  }

  totalActiveAmount() {
    return this.filteredDebts().filter(d => d.status === 'Pending' || d.status === 'Overdue').reduce((sum, d) => sum + d.amount, 0);
  }

  formatAmount(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  getMonthName(month: number): string {
    const months = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months[month] || month.toString();
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Pending': 'Pendiente',
      'Overdue': 'Vencida',
      'Paid': 'Pagada'
    };
    return statusMap[status] || status;
  }

  totalPages = signal(1);
  
  paginatedDebts = signal<any[]>([]);
  filteredDebts = signal<any[]>([]);

  updateFilters() {
    let filtered = this.allDebts();
    
    // Filtrar solo deudas activas (Pending y Overdue)
    filtered = filtered.filter(debt => debt.status === 'Pending' || debt.status === 'Overdue');
    
    // Filtro por búsqueda
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(debt => 
        debt.ownerName.toLowerCase().includes(searchLower) ||
        debt.apartment.toLowerCase().includes(searchLower) ||
        debt.concept.toLowerCase().includes(searchLower)
      );
    }
    
    // Filtro por bloque
    if (this.selectedBlock) {
      filtered = filtered.filter(debt => debt.apartment?.startsWith(this.selectedBlock));
    }
    
    // Filtro por apartamento
    if (this.selectedApartment) {
      filtered = filtered.filter(debt => debt.apartment?.endsWith(this.selectedApartment));
    }
    
    // Ordenamiento
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'dueDate':
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        case 'amount':
          return b.amount - a.amount;
        case 'owner':
          return a.ownerName.localeCompare(b.ownerName);
        default:
          return 0;
      }
    });
    
    this.filteredDebts.set(filtered);
    this.currentPage.set(1);
    this.updatePagination();
  }

  updatePagination() {
    const total = Math.ceil(this.filteredDebts().length / this.pageSize);
    this.totalPages.set(total);
    
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedDebts.set(this.filteredDebts().slice(start, end));
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.updatePagination();
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

  onBlockChange() {
    this.selectedApartment = '';
    this.updateFilters();
  }

  getFilteredApartments() {
    if (!this.selectedBlock) return this.apartments();
    return this.apartments().filter(apt => apt.blockName === this.selectedBlock);
  }

  getOwnersSummary() {
    const ownerMap = new Map();
    
    this.filteredDebts().forEach(debt => {
      const key = `${debt.ownerName}-${debt.apartment}`;
      
      if (!ownerMap.has(key)) {
        ownerMap.set(key, {
          name: debt.ownerName,
          apartment: debt.apartment,
          pendingAmount: 0,
          overdueAmount: 0,
          totalAmount: 0
        });
      }
      
      const owner = ownerMap.get(key);
      
      if (debt.status === 'Pending') {
        owner.pendingAmount += debt.amount;
      } else if (debt.status === 'Overdue') {
        owner.overdueAmount += debt.amount;
      }
      
      owner.totalAmount = owner.pendingAmount + owner.overdueAmount;
    });
    
    return Array.from(ownerMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }

  getDisplayedOwners() {
    const owners = this.getOwnersSummary();
    return this.showAllOwners() ? owners : owners.slice(0, 4);
  }

  toggleShowAllOwners() {
    this.showAllOwners.set(!this.showAllOwners());
  }

  Math = Math;
}