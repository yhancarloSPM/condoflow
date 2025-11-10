import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IncidentService } from '../../core/services/incident.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { IncidentUtilsService } from './services/incident-utils.service';
import { ToastService } from '../../shared/services/toast.service';
import { PaginationService } from './services/pagination.service';
import { IncidentFiltersComponent } from './components/incident-filters.component';
import { IncidentStatusModalComponent } from './components/incident-status-modal.component';
import { Incident, IncidentFilters, IncidentStatusCounts, IncidentUpdateData, IncidentStatus } from './models/incident.models';

@Component({
  selector: 'app-incident-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, IncidentFiltersComponent, IncidentStatusModalComponent],
  templateUrl: './incident-management.component.html',
  styleUrls: ['./incident-management.component.scss']
})
export class IncidentManagementComponent implements OnInit {
  loading = signal(false);
  incidents = signal<Incident[]>([]);
  filteredIncidents = signal<Incident[]>([]);
  currentPage = signal(1);
  pageSize = 10;
  
  paginatedIncidents = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredIncidents().slice(start, end);
  });
  
  totalPages = computed(() => Math.ceil(this.filteredIncidents().length / this.pageSize));
  
  filters: IncidentFilters = {
    status: '',
    priority: '',
    searchTerm: ''
  };
  
  showDetailModal = signal(false);
  selectedIncident = signal<Incident | null>(null);
  
  showStatusModal = signal(false);
  incidentToUpdate = signal<Incident | null>(null);
  
  statusCounts = computed((): IncidentStatusCounts => {
    const incidents = this.incidents();
    return {
      reported: incidents.filter(i => i.status === IncidentStatus.REPORTED).length,
      inProgress: incidents.filter(i => i.status === IncidentStatus.IN_PROGRESS).length,
      resolved: incidents.filter(i => i.status === IncidentStatus.RESOLVED).length,
      rejected: incidents.filter(i => i.status === IncidentStatus.REJECTED).length,
      cancelled: incidents.filter(i => i.status === IncidentStatus.CANCELLED).length
    };
  });
  
  categories = signal<any[]>([]);
  priorities = signal<any[]>([]);
  statuses = signal<any[]>([]);

  constructor(
    private router: Router,
    private authService: AuthService,
    private incidentService: IncidentService,
    private incidentUtils: IncidentUtilsService,
    private toastService: ToastService,
    private paginationService: PaginationService
  ) {}

  ngOnInit(): void {
    this.loadCatalogs();
    
    this.getCategoryLabel = this.incidentUtils.getCategoryLabel.bind(this.incidentUtils);
    this.getPriorityLabel = this.incidentUtils.getPriorityLabel.bind(this.incidentUtils);
    this.getPrioritySeverity = this.incidentUtils.getPrioritySeverity.bind(this.incidentUtils);
    this.getStatusLabel = this.incidentUtils.getStatusLabel.bind(this.incidentUtils);
    this.getStatusSeverity = this.incidentUtils.getStatusSeverity.bind(this.incidentUtils);
    
    this.loadIncidents();
  }

  private loadCatalogs(): void {
    this.incidentUtils.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (error) => {
        console.error('Error loading categories:', error);
        this.categories.set([]);
      }
    });

    this.incidentUtils.getPriorities().subscribe({
      next: (priorities) => {
        console.log('Priorities loaded in incidents:', priorities);
        this.priorities.set(priorities);
      },
      error: (error) => {
        console.error('Error loading priorities:', error);
        this.priorities.set([]);
      }
    });

    this.incidentUtils.getStatuses().subscribe({
      next: (statuses) => {
        console.log('Statuses loaded in incidents:', statuses);
        this.statuses.set(statuses);
      },
      error: (error) => {
        console.error('Error loading statuses:', error);
        this.statuses.set([]);
      }
    });
  }

  loadIncidents(): void {
    this.loading.set(true);
    this.incidentService.getAllIncidents().subscribe({
      next: (response) => {
        if (response.success) {
          this.incidents.set(response.data || []);
          this.applyFilters();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando incidencias:', error);
        this.toastService.showError('Error al cargar las incidencias');
        this.incidents.set([]);
        this.loading.set(false);
      }
    });
  }

  onFiltersChanged(filters: IncidentFilters): void {
    this.filters = filters;
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.incidents()];
    
    if (this.filters.status) {
      filtered = filtered.filter(i => i.status === this.filters.status);
    }
    
    if (this.filters.priority) {
      filtered = filtered.filter(i => i.priority === this.filters.priority);
    }
    
    if (this.filters.searchTerm) {
      const term = this.filters.searchTerm.toLowerCase();
      filtered = filtered.filter(i => 
        i.title.toLowerCase().includes(term) || 
        i.ownerName.toLowerCase().includes(term)
      );
    }
    
    this.filteredIncidents.set(filtered);
    this.currentPage.set(1);
  }

  viewIncidentDetail(incident: Incident): void {
    this.selectedIncident.set(incident);
    this.showDetailModal.set(true);
  }

  openStatusModal(incident: Incident): void {
    this.incidentToUpdate.set(incident);
    this.showStatusModal.set(true);
  }

  onStatusModalClosed(): void {
    this.showStatusModal.set(false);
    this.incidentToUpdate.set(null);
  }

  onStatusUpdated(updateData: IncidentUpdateData): void {
    const incident = this.incidentToUpdate();
    if (!incident) return;
    
    this.incidentService.updateIncidentStatusWithComment(incident.id, updateData).subscribe({
      next: (response) => {
        if (response.success) {
          const message = updateData.status === IncidentStatus.REJECTED 
            ? 'Incidencia rechazada y notificación enviada al propietario'
            : 'Estado actualizado exitosamente';
          this.toastService.showSuccess(message);
          this.loadIncidents();
        }
        this.onStatusModalClosed();
      },
      error: (error) => {
        console.error('Error actualizando estado:', error);
        this.toastService.showError('Error al actualizar el estado');
        this.onStatusModalClosed();
      }
    });
  }

  viewImage(incident: Incident): void {
    if (incident.id) {
      const token = this.authService.getToken();
      const url = `https://localhost:7009/api/incidents/${incident.id}/image?access_token=${token}`;
      window.open(url, '_blank');
    }
  }

  getCategoryLabel!: (category: any) => string;
  getPriorityLabel!: (priority: any) => string;
  getPrioritySeverity!: (priority: any) => string;
  getStatusLabel!: (status: any) => string;
  getStatusSeverity!: (status: any) => string;

  goToPage(page: number): void {
    if (this.paginationService.isValidPage(page, this.totalPages())) {
      this.currentPage.set(page);
    }
  }
  
  getPageNumbers(): (number | string)[] {
    return this.paginationService.getPageNumbers(this.currentPage(), this.totalPages());
  }

  Math = Math;
}