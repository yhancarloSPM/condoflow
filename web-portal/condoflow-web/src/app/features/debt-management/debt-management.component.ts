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
  templateUrl: './debt-management.component.html',
  styleUrls: ['./debt-management.component.scss']
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
  sortBy = 'amount';
  currentPage = signal(1);
  pageSize = 10;
  showAllOwners = signal(false);
  showDetailModal = signal(false);
  selectedDebt = signal<any>(null);

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
    console.log('Cargando resumen de propietarios...');
    this.adminDebtService.getOwnersSummary().subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        if (response.success) {
          console.log('Datos recibidos:', response.data);
          console.log('Primer propietario:', response.data[0]);
          // Agregar key para el template
          const dataWithKeys = response.data.map((owner: any) => ({
            ...owner,
            key: owner.ownerId
          }));
          this.allDebts.set(dataWithKeys);
          console.log('Datos con keys:', dataWithKeys[0]);
          this.updateFilters();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando resumen de propietarios:', error);
        this.loading.set(false);
      }
    });
  }

  totalPendingDebts() {
    return this.filteredOwners().reduce((sum, owner) => sum + owner.pendingCount, 0);
  }

  totalOverdueDebts() {
    return this.filteredOwners().reduce((sum, owner) => sum + owner.overdueCount, 0);
  }

  totalActiveDebts() {
    return this.totalPendingDebts() + this.totalOverdueDebts();
  }

  totalPendingAmount() {
    return this.filteredOwners().reduce((sum, owner) => sum + owner.pendingAmount, 0);
  }

  totalOverdueAmount() {
    return this.filteredOwners().reduce((sum, owner) => sum + owner.overdueAmount, 0);
  }

  totalActiveAmount() {
    return this.filteredOwners().reduce((sum, owner) => sum + owner.totalAmount, 0);
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
  paginatedOwners = signal<any[]>([]);
  filteredOwners = signal<any[]>([]);

  updateFilters() {
    let filtered = this.allDebts();
    
    // Filtro por búsqueda
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(owner => 
        owner.name.toLowerCase().includes(searchLower) ||
        owner.apartment.toLowerCase().includes(searchLower)
      );
    }
    
    // Filtro por bloque
    if (this.selectedBlock) {
      filtered = filtered.filter(owner => owner.apartment?.startsWith(this.selectedBlock));
    }
    
    // Filtro por apartamento
    if (this.selectedApartment) {
      filtered = filtered.filter(owner => owner.apartment?.endsWith(this.selectedApartment));
    }
    
    // Ordenamiento
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'amount':
          return b.totalAmount - a.totalAmount;
        case 'owner':
          return a.name.localeCompare(b.name);
        case 'apartment':
          return a.apartment.localeCompare(b.apartment);
        default:
          return b.totalAmount - a.totalAmount;
      }
    });
    
    this.filteredOwners.set(filtered);
    this.currentPage.set(1);
    this.updatePagination();
  }

  updatePagination() {
    const total = Math.ceil(this.filteredOwners().length / this.pageSize);
    this.totalPages.set(total);
    
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedOwners.set(this.filteredOwners().slice(start, end));
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

  processDebtsToOwnersSummary(debts: any[]): any[] {
    console.log('Procesando', debts.length, 'deudas');
    console.log('Primera deuda:', debts[0]);
    
    const ownerMap = new Map();
    
    // Filtrar solo deudas activas
    const activeDebts = debts.filter(debt => debt.status === 'Pending' || debt.status === 'Overdue');
    console.log('Deudas activas encontradas:', activeDebts.length);
    
    activeDebts.forEach(debt => {
      const key = `${debt.ownerId}`;
      
      if (!ownerMap.has(key)) {
        ownerMap.set(key, {
          key: key,
          ownerId: debt.ownerId,
          name: debt.ownerName,
          apartment: debt.apartment,
          pendingAmount: 0,
          overdueAmount: 0,
          totalAmount: 0,
          pendingCount: 0,
          overdueCount: 0,
          lastUpdate: debt.createdAt
        });
      }
      
      const owner = ownerMap.get(key);
      
      if (debt.status === 'Pending') {
        owner.pendingAmount += debt.amount;
        owner.pendingCount++;
      } else if (debt.status === 'Overdue') {
        owner.overdueAmount += debt.amount;
        owner.overdueCount++;
      }
      
      owner.totalAmount = owner.pendingAmount + owner.overdueAmount;
      
      // Actualizar fecha más reciente
      if (new Date(debt.createdAt) > new Date(owner.lastUpdate)) {
        owner.lastUpdate = debt.createdAt;
      }
    });
    
    const result = Array.from(ownerMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
    console.log('Resumen de propietarios procesado:', result);
    return result;
  }

  viewOwnerSummary(owner: any) {
    this.selectedDebt.set(owner);
    this.showDetailModal.set(true);
  }

  viewDebtDetail(owner: any) {
    this.viewOwnerSummary(owner);
  }

  showDebtDetails() {
    const owner = this.selectedDebt();
    if (owner?.ownerId) {
      console.log('Cargando detalles para owner:', owner.ownerId);
      this.adminDebtService.getOwnerDebtsDetail(owner.ownerId).subscribe({
        next: (response) => {
          console.log('Respuesta detalles:', response);
          if (response.success) {
            // Actualizar el selectedDebt con los detalles
            const updatedOwner = {
              ...owner,
              debts: response.data
            };
            console.log('Owner actualizado:', updatedOwner);
            this.selectedDebt.set(updatedOwner);
          }
        },
        error: (error) => {
          console.error('Error cargando detalle de deudas:', error);
        }
      });
    }
  }
}