import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IncidentService } from '../../core/services/incident.service';
import { CatalogService, CatalogItem } from '../../core/services/catalog.service';
import { NavbarComponent } from '../../shared/components/navbar.component';

@Component({
  selector: 'app-my-incidents',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './my-incidents.component.html',
  styleUrls: ['./my-incidents.component.scss']

})
export class MyIncidentsComponent implements OnInit {
  loading = signal(false);
  incidents = signal<any[]>([]);
  currentPage = signal(1);
  pageSize = 10;
  statusFilter = '';
  dateFromFilter = '';
  dateToFilter = '';
  allIncidents: any[] = [];
  filteredIncidents = signal<any[]>([]);
  
  paginatedIncidents = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.incidents().slice(start, end);
  });
  
  totalPages = computed(() => Math.ceil(this.incidents().length / this.pageSize));
  
  selectedCategory = '';
  selectedPriority = '';
  title = '';
  description = '';
  selectedFile: File | null = null;
  showCancelModal = signal(false);
  incidentToCancel = signal<any>(null);
  cancelling = signal(false);
  ownerCancelComment = '';
  showDetailModal = signal(false);
  selectedIncident = signal<any>(null);
  
  statusCounts = signal({
    reported: 0,
    inProgress: 0,
    resolved: 0,
    cancelled: 0
  });
  
  // Catálogos dinámicos
  categories = signal<CatalogItem[]>([]);
  priorities = signal<CatalogItem[]>([]);
  incidentStatuses = signal<CatalogItem[]>([]);

  constructor(
    private router: Router,
    private authService: AuthService,
    private incidentService: IncidentService,
    private catalogService: CatalogService
  ) {}

  ngOnInit() {
    this.loadCatalogs();
    this.loadIncidents();
  }

  private loadCatalogs() {
    // Cargar categorías
    this.catalogService.getCategories().subscribe({
      next: (response) => {
        this.categories.set(response.data || []);
      },
      error: (error) => console.error('Error loading categories:', error)
    });

    // Cargar prioridades
    this.catalogService.getPriorities().subscribe({
      next: (response) => {
        this.priorities.set(response.data || []);
      },
      error: (error) => console.error('Error loading priorities:', error)
    });

    // Cargar estados de incidencia
    this.catalogService.getIncidentStatuses().subscribe({
      next: (response) => {
        this.incidentStatuses.set(response.data || []);
      },
      error: (error) => console.error('Error loading incident statuses:', error)
    });
  }

  loadIncidents() {
    this.incidentService.getMyIncidents().subscribe({
      next: (response) => {
        if (response.success) {
          this.allIncidents = response.data || [];
          this.applyFilters();
        }
        this.updateCounts();
      },
      error: (error) => {
        console.error('Error cargando incidencias:', error);
        this.incidents.set([]);
        this.updateCounts();
      }
    });
  }

  applyFilters() {
    let filtered = [...this.allIncidents];
    
    if (this.statusFilter) {
      filtered = filtered.filter(incident => incident.status === this.statusFilter);
    }
    
    if (this.dateFromFilter) {
      const fromDate = new Date(this.dateFromFilter);
      filtered = filtered.filter(incident => new Date(incident.createdAt) >= fromDate);
    }
    
    if (this.dateToFilter) {
      const toDate = new Date(this.dateToFilter);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(incident => new Date(incident.createdAt) <= toDate);
    }
    
    this.filteredIncidents.set(filtered);
    this.incidents.set(filtered);
    this.currentPage.set(1);
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'reported': 'reported',
      'in_progress': 'in_progress',
      'resolved': 'resolved',
      'cancelled': 'cancelled',
      'rejected': 'cancelled'
    };
    return statusMap[status] || 'reported';
  }

  getCategoryClass(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'electrical': 'electrical',
      'plumbing': 'plumbing',
      'maintenance': 'maintenance',
      'security': 'security',
      'cleaning': 'cleaning',
      'other': 'other'
    };
    return categoryMap[category] || 'other';
  }

  getPriorityClass(priority: string): string {
    const priorityMap: { [key: string]: string } = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'urgent': 'urgent'
    };
    return priorityMap[priority] || 'medium';
  }

  createIncident() {
    if (!this.selectedCategory || !this.selectedPriority || !this.title || !this.description) return;
    
    this.loading.set(true);
    
    const formData = new FormData();
    formData.append('category', this.selectedCategory);
    formData.append('priority', this.selectedPriority);
    formData.append('title', this.title);
    formData.append('description', this.description);
    
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }
    
    this.incidentService.createIncidentWithImage(formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccessMessage('Incidencia reportada exitosamente');
          this.resetForm();
          this.loadIncidents();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error creando incidencia:', error);
        const errorMessage = error.error?.message || 'Error al reportar la incidencia';
        this.showErrorMessage(errorMessage);
        this.loading.set(false);
      }
    });
  }

  resetForm() {
    this.selectedCategory = '';
    this.selectedPriority = '';
    this.title = '';
    this.description = '';
    this.selectedFile = null;
  }

  updateCounts() {
    const incidents = this.incidents();
    this.statusCounts.set({
      reported: incidents.filter(i => i.status === 'reported').length,
      inProgress: incidents.filter(i => i.status === 'in_progress').length,
      resolved: incidents.filter(i => i.status === 'resolved').length,
      cancelled: incidents.filter(i => i.status === 'cancelled' || i.status === 'rejected').length
    });
  }

  getCategoryName(category: string): string {
    const cat = this.categories().find(c => c.code === category);
    return cat ? cat.name : category;
  }

  getPriorityName(priority: string): string {
    const pri = this.priorities().find(p => p.code === priority);
    return pri ? pri.name : priority;
  }

  // Mantener compatibilidad con funciones existentes
  getCategoryLabel = this.getCategoryName;
  getPriorityLabel = this.getPriorityName;

  getPrioritySeverity(priority: string): string {
    const severityMap: { [key: string]: string } = {
      'critical': 'danger',
      'high': 'warning',
      'medium': 'info',
      'low': 'secondary'
    };
    return severityMap[priority] || 'secondary';
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'reported': 'Reportada',
      'in_progress': 'En Proceso',
      'resolved': 'Resuelta',
      'cancelled': 'Cancelada',
      'rejected': 'Rechazada'
    };
    return statusMap[status] || status;
  }

  getStatusSeverity(status: string): string {
    const severityMap: { [key: string]: string } = {
      'reported': 'warning',
      'in_progress': 'info',
      'resolved': 'success',
      'cancelled': 'secondary',
      'rejected': 'danger'
    };
    return severityMap[status] || 'secondary';
  }

  getOwnerStatusLabel(incident: any): string {
    // Owner siempre ve sus cancelaciones como "Cancelada", rechazos como "Rechazada"
    if (incident.status === 'rejected' && incident.adminComment) {
      return 'Rechazada'; // Admin la rechazó
    }
    if (incident.status === 'rejected' || incident.status === 'cancelled') {
      return 'Cancelada'; // Él la canceló
    }
    return this.getStatusLabel(incident.status);
  }

  getOwnerStatusSeverity(incident: any): string {
    // Owner: rechazos en rojo, cancelaciones en gris
    if (incident.status === 'rejected' && incident.adminComment) {
      return 'danger'; // Rojo - Admin rechazó
    }
    if (incident.status === 'rejected' || incident.status === 'cancelled') {
      return 'secondary'; // Gris - Él canceló
    }
    return this.getStatusSeverity(incident.status);
  }

  showSuccessMessage(message: string) {
    const toast = document.createElement('div');
    toast.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; background: #10B981; color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; font-weight: 500;">
        <i class="pi pi-check-circle" style="margin-right: 0.5rem;"></i>
        ${message}
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showErrorMessage('La imagen no puede ser mayor a 5MB');
        return;
      }
      
      // Validar tipo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        this.showErrorMessage('Solo se permiten archivos JPG y PNG');
        return;
      }
      
      this.selectedFile = file;
    }
  }

  triggerFileInput() {
    const fileInput = document.getElementById('incidentImage') as HTMLInputElement;
    fileInput?.click();
  }

  removeFile(event: Event) {
    event.stopPropagation();
    this.selectedFile = null;
    const fileInput = document.getElementById('incidentImage') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  openCancelModal(id: string) {
    const incident = this.incidents().find(i => i.id === id);
    this.incidentToCancel.set(incident);
    this.ownerCancelComment = '';
    this.showCancelModal.set(true);
  }

  cancelIncident() {
    const incident = this.incidentToCancel();
    if (!incident || !this.ownerCancelComment.trim()) return;
    
    this.cancelling.set(true);
    
    this.incidentService.cancelIncident(incident.id, this.ownerCancelComment).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccessMessage('Incidencia cancelada exitosamente');
          this.loadIncidents();
        }
        this.showCancelModal.set(false);
        this.cancelling.set(false);
      },
      error: (error) => {
        console.error('Error cancelando incidencia:', error);
        this.showErrorMessage('Error al cancelar la incidencia');
        this.showCancelModal.set(false);
        this.cancelling.set(false);
      }
    });
  }

  showErrorMessage(message: string) {
    const toast = document.createElement('div');
    toast.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; background: #EF4444; color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; font-weight: 500;">
        <i class="pi pi-times-circle" style="margin-right: 0.5rem;"></i>
        ${message}
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
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
  
  Math = Math;

  viewIncidentDetail(incident: any) {
    this.selectedIncident.set(incident);
    this.showDetailModal.set(true);
  }

  viewImage(incident: any) {
    if (incident.id) {
      const token = this.authService.getToken();
      const url = `https://localhost:7009/api/incidents/${incident.id}/image?access_token=${token}`;
      window.open(url, '_blank');
    }
  }
}