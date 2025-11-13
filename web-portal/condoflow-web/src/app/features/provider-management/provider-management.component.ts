import { Component, OnInit, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgForm } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { NavbarComponent } from '../../shared/components/navbar.component';

declare var bootstrap: any;

interface Provider {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  rnc?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

@Component({
  selector: 'app-provider-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './provider-management.component.html',
  styleUrls: ['./provider-management.component.scss']
})
export class ProviderManagementComponent implements OnInit {
  providers = signal<Provider[]>([]);
  loading = signal(false);
  isEditing = signal(false);
  currentPage = signal(1);
  itemsPerPage = 10;

  filters = {
    search: '',
    status: ''
  };

  currentProvider: Partial<Provider> = {
    name: '',
    phone: '',
    email: '',
    rnc: '',
    address: '',
    isActive: true
  };

  filteredProviders = computed(() => {
    let filtered = [...this.providers()];

    if (this.filters.status) {
      const isActive = this.filters.status === 'active';
      filtered = filtered.filter(p => p.isActive === isActive);
    }

    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search) ||
        (p.email && p.email.toLowerCase().includes(search)) ||
        (p.phone && p.phone.toLowerCase().includes(search)) ||
        (p.rnc && p.rnc.toLowerCase().includes(search))
      );
    }

    return filtered;
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredProviders().length / this.itemsPerPage);
  });

  paginatedProviders = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredProviders().slice(start, end);
  });

  providerToDelete = signal<Provider | null>(null);
  showDeleteModal = signal(false);
  
  @ViewChild('providerForm') providerForm!: NgForm;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProviders();
  }

  loadProviders() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/providers`).subscribe({
      next: (response) => {
        if (response.success) {
          this.providers.set(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando proveedores:', error);
        this.providers.set([]);
        this.loading.set(false);
      }
    });
  }

  applyFilters() {
    this.currentPage.set(1);
    // Force recalculation of computed signals
    this.filteredProviders();
  }

  openCreateModal() {
    this.isEditing.set(false);
    this.currentProvider = {
      name: '',
      phone: '',
      email: '',
      rnc: '',
      address: '',
      isActive: true
    };
    const modal = new bootstrap.Modal(document.getElementById('providerModal'));
    modal.show();
  }

  editProvider(provider: Provider) {
    this.isEditing.set(true);
    this.currentProvider = { ...provider };
    const modal = new bootstrap.Modal(document.getElementById('providerModal'));
    modal.show();
  }

  saveProvider() {
    this.loading.set(true);
    
    const url = this.isEditing() 
      ? `${environment.apiUrl}/providers/${this.currentProvider.id}`
      : `${environment.apiUrl}/providers`;
    
    const method = this.isEditing() ? 'PUT' : 'POST';
    
    this.http.request(method, url, { body: this.currentProvider }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.loadProviders();
          const modal = bootstrap.Modal.getInstance(document.getElementById('providerModal'));
          modal.hide();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error guardando proveedor:', error);
        this.loading.set(false);
      }
    });
  }

  deleteProvider(id: number) {
    const provider = this.providers().find(p => p.id === id);
    if (provider) {
      this.providerToDelete.set(provider);
      this.showDeleteModal.set(true);
    }
  }

  confirmDelete() {
    const provider = this.providerToDelete();
    if (!provider) return;

    this.loading.set(true);
    this.http.delete(`${environment.apiUrl}/providers/${provider.id}`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.loadProviders();
        }
        this.loading.set(false);
        this.closeDeleteModal();
      },
      error: (error) => {
        console.error('Error eliminando proveedor:', error);
        this.loading.set(false);
        this.closeDeleteModal();
      }
    });
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.providerToDelete.set(null);
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
    return Math.min(this.getStartIndex() + this.itemsPerPage, this.filteredProviders().length);
  }

  resetForm() {
    this.currentProvider = {
      name: '',
      phone: '',
      email: '',
      rnc: '',
      address: '',
      isActive: true
    };
    if (this.providerForm) {
      this.providerForm.resetForm();
    }
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
        pages.push(-1);
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1);
        pages.push(total);
      }
    }
    
    return pages;
  }
}