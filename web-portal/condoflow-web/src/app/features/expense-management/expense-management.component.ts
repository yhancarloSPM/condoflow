import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { NavbarComponent } from '../../shared/components/navbar.component';

declare var bootstrap: any;

interface Expense {
  id: number;
  description: string;
  amount: number;
  date: string;
  categoryId: number;
  statusId: number;
  providerId?: number;
  providerName?: string;
  notes?: string;
  invoiceUrl?: string;
  createdBy: string;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
}

interface Status {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

interface Provider {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  rnc?: string;
  address?: string;
  isActive: boolean;
}

@Component({
  selector: 'app-expense-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './expense-management.component.html',
  styleUrls: ['./expense-management.component.scss']
})
export class ExpenseManagementComponent implements OnInit {
  expenses = signal<Expense[]>([]);
  categories = signal<Category[]>([]);
  statuses = signal<Status[]>([]);
  providers = signal<Provider[]>([]);
  loading = signal(false);
  isEditing = signal(false);
  currentPage = signal(1);
  itemsPerPage = 10;

  filters = {
    category: '',
    status: '',
    month: '',
    search: ''
  };

  currentExpense: Partial<Expense> = {
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    categoryId: 0,
    statusId: 0,
    providerId: 0,
    notes: '',
    invoiceUrl: ''
  };

  selectedInvoiceFile: File | null = null;

  months = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
  ];

  filteredExpenses = computed(() => {
    let filtered = this.expenses();

    if (this.filters.category) {
      filtered = filtered.filter(e => e.categoryId.toString() === this.filters.category);
    }

    if (this.filters.status) {
      filtered = filtered.filter(e => e.statusId.toString() === this.filters.status);
    }

    if (this.filters.month) {
      filtered = filtered.filter(e => {
        const expenseMonth = new Date(e.date).getMonth() + 1;
        return expenseMonth.toString() === this.filters.month;
      });
    }

    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      filtered = filtered.filter(e => 
        e.description.toLowerCase().includes(search) ||
        e.providerName?.toLowerCase().includes(search) ||
        e.notes?.toLowerCase().includes(search)
      );
    }

    return filtered;
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredExpenses().length / this.itemsPerPage);
  });

  paginatedExpenses = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredExpenses().slice(start, end);
  });

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadExpenses();
    this.loadCategories();
    this.loadStatuses();
    this.loadProviders();
  }

  loadExpenses() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/expenses`).subscribe({
      next: (response) => {
        if (response.success) {
          this.expenses.set(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando gastos:', error);
        this.expenses.set([]);
        this.loading.set(false);
      }
    });
  }

  loadCategories() {
    this.http.get<any>(`${environment.apiUrl}/expense-categories`).subscribe({
      next: (response) => {
        if (response.success) {
          this.categories.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error cargando categorías:', error);
        this.categories.set([]);
      }
    });
  }

  loadStatuses() {
    this.http.get<any>(`${environment.apiUrl}/statuses/expense`).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Estados cargados:', response.data);
          this.statuses.set(response.data);
        } else {
          console.error('Error en respuesta:', response);
          this.statuses.set([]);
        }
      },
      error: (error) => {
        console.error('Error cargando estados:', error);
        this.statuses.set([]);
      }
    });
  }

  applyFilters() {
    this.currentPage.set(1);
    // Force recalculation of computed signals
    this.filteredExpenses();
  }

  openCreateModal() {
    this.isEditing.set(false);
    // Obtener el estado "pending" por defecto
    const pendingStatus = this.statuses().find(s => s.code === 'pending');
    this.currentExpense = {
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      categoryId: 0,
      statusId: pendingStatus?.id || 0,
      providerId: 0,
      notes: '',
      invoiceUrl: ''
    };
    this.selectedInvoiceFile = null;
    const modal = new bootstrap.Modal(document.getElementById('expenseModal'));
    modal.show();
  }

  editExpense(expense: Expense) {
    this.isEditing.set(true);
    this.currentExpense = { ...expense };
    this.selectedInvoiceFile = null;
    const modal = new bootstrap.Modal(document.getElementById('expenseModal'));
    modal.show();
  }

  saveExpense() {
    this.loading.set(true);
    
    const formData = new FormData();
    formData.append('description', this.currentExpense.description || '');
    formData.append('amount', this.currentExpense.amount?.toString() || '0');
    formData.append('date', this.currentExpense.date || '');
    formData.append('categoryId', this.currentExpense.categoryId?.toString() || '0');
    formData.append('statusId', this.currentExpense.statusId?.toString() || '0');
    formData.append('providerId', this.currentExpense.providerId?.toString() || '0');
    formData.append('notes', this.currentExpense.notes || '');
    
    if (this.selectedInvoiceFile) {
      formData.append('invoice', this.selectedInvoiceFile);
    }
    
    const url = this.isEditing() 
      ? `${environment.apiUrl}/expenses/${this.currentExpense.id?.toString()}`
      : `${environment.apiUrl}/expenses`;
    
    const method = this.isEditing() ? 'PUT' : 'POST';
    
    this.http.request(method, url, { body: formData }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.loadExpenses();
          const modal = bootstrap.Modal.getInstance(document.getElementById('expenseModal'));
          modal.hide();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error guardando gasto:', error);
        this.loading.set(false);
      }
    });
  }

  expenseToDelete = signal<Expense | null>(null);
  showDeleteModal = signal(false);

  deleteExpense(id: number) {
    const expense = this.expenses().find(e => e.id === id);
    if (expense) {
      this.expenseToDelete.set(expense);
      this.showDeleteModal.set(true);
    }
  }

  confirmDelete() {
    const expense = this.expenseToDelete();
    if (!expense) return;

    this.loading.set(true);
    this.http.delete(`${environment.apiUrl}/expenses/${expense.id.toString()}`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.loadExpenses();
        }
        this.loading.set(false);
        this.closeDeleteModal();
      },
      error: (error) => {
        console.error('Error eliminando gasto:', error);
        this.loading.set(false);
        this.closeDeleteModal();
      }
    });
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.expenseToDelete.set(null);
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories().find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
  }



  getCategoryClass(categoryId: number): string {
    const category = this.categories().find(c => c.id === categoryId);
    const classMap: { [key: string]: string } = {
      'Mantenimiento': 'mantenimiento',
      'Limpieza': 'limpieza', 
      'Seguridad': 'seguridad',
      'Servicios': 'servicios',
      'Administración': 'administracion',
      'Reparaciones': 'reparaciones'
    };
    return classMap[category?.name || ''] || 'mantenimiento';
  }

  getStatusName(statusId: number): string {
    const status = this.statuses().find(s => s.id === statusId);
    return status?.name || 'Sin estado';
  }

  getStatusBootstrapClass(statusId: number): string {
    const status = this.statuses().find(s => s.id === statusId);
    if (!status) return 'bg-warning';
    
    const code = status.code.toLowerCase();
    switch(code) {
      case 'confirmed': return 'bg-success';
      case 'paid': return 'bg-info';
      case 'rejected': return 'bg-danger';
      case 'cancelled': return 'bg-danger';
      case 'pending': return 'bg-warning';
      default: return 'bg-warning';
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getStartIndex(): number {
    return (this.currentPage() - 1) * this.itemsPerPage;
  }

  getEndIndex(): number {
    return Math.min(this.getStartIndex() + this.itemsPerPage, this.filteredExpenses().length);
  }

  getVisiblePages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1); // dots
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push(-1); // dots
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1); // dots
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1); // dots
        pages.push(total);
      }
    }
    
    return pages;
  }

  getIconColorByStatus(statusId: number): string {
    const status = this.statuses().find(s => s.id === statusId);
    if (!status) return '#6b7280';
    
    const code = status.code.toLowerCase();
    switch(code) {
      case 'pending': return '#f59e0b'; // amarillo
      case 'confirmed': return '#10b981'; // verde
      case 'paid': return '#3b82f6'; // azul
      case 'rejected': return '#ef4444'; // rojo
      case 'cancelled': return '#ef4444'; // rojo
      default: return '#6b7280'; // gris
    }
  }

  onInvoiceFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo es muy grande. Máximo 5MB.');
        return;
      }
      
      // Validar tipo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Formato no válido. Solo JPG, PNG y PDF.');
        return;
      }
      
      this.selectedInvoiceFile = file;
    }
  }

  triggerInvoiceFileInput() {
    const fileInput = document.querySelector('#expenseModal input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  removeInvoiceFile(event: Event) {
    event.stopPropagation();
    this.selectedInvoiceFile = null;
    this.currentExpense.invoiceUrl = '';
    // Reset file input
    const fileInput = document.querySelector('#expenseModal input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  isStatusReadonly(): boolean {
    return !this.isEditing();
  }

  loadProviders() {
    this.http.get<any>(`${environment.apiUrl}/providers/active`).subscribe({
      next: (response) => {
        if (response.success) {
          this.providers.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error cargando proveedores:', error);
        this.providers.set([]);
      }
    });
  }

  getProviderName(providerId: number): string {
    const provider = this.providers().find(p => p.id === providerId);
    return provider?.name || 'Sin proveedor';
  }

  getAvailableStatuses(): Status[] {
    if (!this.isEditing()) {
      // Al crear, solo mostrar "pending"
      return this.statuses().filter(s => s.code === 'pending');
    } else {
      // Al editar, excluir "pending" si el estado actual no es pending
      const currentStatus = this.statuses().find(s => s.id === this.currentExpense.statusId);
      if (currentStatus?.code === 'pending') {
        return this.statuses(); // Mostrar todos si está en pending
      } else {
        return this.statuses().filter(s => s.code !== 'pending'); // Excluir pending
      }
    }
  }
}