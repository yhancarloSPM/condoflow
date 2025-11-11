import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { AnnouncementService } from '../../core/services/announcement.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { AnnouncementFiltersComponent } from './components/announcement-filters.component';
import { Announcement, AnnouncementFilters } from './models/announcement.models';
import { AnnouncementUtilsService } from './services/announcement-utils.service';
import { PaginationService } from './services/pagination.service';

@Component({
  selector: 'app-announcement-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent, AnnouncementFiltersComponent],
  templateUrl: './announcement-management.component.html',
  styleUrls: ['./announcement-management.component.scss']
})
export class AnnouncementManagementComponent implements OnInit {
  currentUser = signal<any>(null);
  announcements = signal<Announcement[]>([]);
  loading = signal(true);
  creating = signal(false);
  
  // Filtros
  filterData: AnnouncementFilters = {
    type: '',
    dateFilter: '',
    searchTerm: ''
  };
  
  filteredAnnouncements = signal<Announcement[]>([]);
  
  // Paginación
  currentPage = signal(1);
  pageSize = 6;
  
  paginatedAnnouncements = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredAnnouncements().slice(start, end);
  });
  
  totalPages = computed(() => Math.ceil(this.filteredAnnouncements().length / this.pageSize));
  
  // Modales
  showCreateModal = signal(false);
  showDeleteModal = signal(false);
  showDetailModal = signal(false);
  announcementToDelete = signal<Announcement | null>(null);
  selectedAnnouncement = signal<Announcement | null>(null);
  
  announcementForm: FormGroup;
  Math = Math;
  
  // Tabs
  activeTab = signal<'create' | 'view'>('view');
  
  // Collapsible Form
  showForm = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
    private announcementService: AnnouncementService,
    private fb: FormBuilder,
    private announcementUtils: AnnouncementUtilsService,
    private paginationService: PaginationService
  ) {
    this.announcementForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      eventDate: [''],
      isUrgent: [false]
    });
  }

  ngOnInit() {
    this.currentUser.set(this.authService.currentUser());
    this.loadAnnouncements();
  }

  loadAnnouncements() {
    this.loading.set(true);
    this.announcementService.getAnnouncements().subscribe({
      next: (response) => {
        if (response.success) {
          this.announcements.set(response.data || []);
          this.applyFilters();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando anuncios:', error);
        this.announcements.set([]);
        this.applyFilters();
        this.loading.set(false);
      }
    });
  }

  onFiltersChange(filters: AnnouncementFilters) {
    this.filterData = filters;
    this.applyFilters();
  }
  
  applyFilters() {
    let filtered = [...this.announcements()];
    
    if (this.filterData.type) {
      filtered = filtered.filter(a => {
        switch (this.filterData.type) {
          case 'urgent': return a.isUrgent;
          case 'event': return !!a.eventDate && !a.isUrgent;
          case 'info': return !a.isUrgent && !a.eventDate;
          default: return true;
        }
      });
    }
    
    if (this.filterData.dateFilter) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      filtered = filtered.filter(a => {
        const announcementDate = new Date(a.createdAt);
        
        switch (this.filterData.dateFilter) {
          case 'current-month':
            return announcementDate.getFullYear() === currentYear && 
                   announcementDate.getMonth() === currentMonth;
          case 'last-3-months':
            const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            return announcementDate >= threeMonthsAgo;
          case 'last-6-months':
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
            return announcementDate >= sixMonthsAgo;
          case 'current-year':
            return announcementDate.getFullYear() === currentYear;
          default:
            return true;
        }
      });
    }
    
    if (this.filterData.searchTerm) {
      const term = this.filterData.searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(term) ||
        a.content.toLowerCase().includes(term)
      );
    }
    
    // Ordenar por fecha de creación (más recientes primero)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    this.filteredAnnouncements.set(filtered);
    this.currentPage.set(1);
  }
  
  getPageNumbers(): (number | string)[] {
    return this.paginationService.getPageNumbers(this.currentPage(), this.totalPages());
  }

  goToPage(page: number) {
    if (this.paginationService.isValidPage(page, this.totalPages())) {
      this.currentPage.set(page);
    }
  }

  onCreateAnnouncement() {
    if (this.announcementForm.valid) {
      this.creating.set(true);
      
      const formData = {
        title: this.announcementForm.value.title?.trim() || '',
        content: this.announcementForm.value.content?.trim() || '',
        eventDate: this.announcementForm.value.eventDate || null,
        isUrgent: Boolean(this.announcementForm.value.isUrgent)
      };
      
      this.announcementService.createAnnouncement(formData).subscribe({
        next: (response) => {
          this.creating.set(false);
          if (response.success) {
            this.showSuccessMessage('Comunicado publicado exitosamente');
            this.announcementForm.reset();
            this.loadAnnouncements();
          }
        },
        error: (error) => {
          this.creating.set(false);
          console.error('Error creando anuncio:', error);
          this.showErrorMessage('Error al publicar el comunicado');
        }
      });
    }
  }

  openDeleteModal(announcement: Announcement) {
    this.announcementToDelete.set(announcement);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.announcementToDelete.set(null);
  }

  confirmDelete() {
    const announcement = this.announcementToDelete();
    if (!announcement) return;

    this.announcementService.deleteAnnouncement(announcement.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccessMessage('Comunicado eliminado exitosamente');
          this.loadAnnouncements();
          this.closeDeleteModal();
        }
      },
      error: (error) => {
        console.error('Error eliminando anuncio:', error);
        this.showErrorMessage('Error al eliminar el comunicado');
        this.closeDeleteModal();
      }
    });
  }

  private showSuccessMessage(message: string) {
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

  private showErrorMessage(message: string) {
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

  navigateToHome() {
    this.router.navigate(['/welcome']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'A';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }
  
  // Utility methods
  getTypeSeverity(isUrgent: boolean, hasEventDate: boolean): string {
    return this.announcementUtils.getTypeSeverity(isUrgent, hasEventDate);
  }
  
  getTypeText(isUrgent: boolean, hasEventDate: boolean): string {
    return this.announcementUtils.getTypeText(isUrgent, hasEventDate);
  }
  
  truncateContent(content: string, maxLength: number = 100): string {
    return this.announcementUtils.truncateContent(content, maxLength);
  }
  
  setActiveTab(tab: 'create' | 'view') {
    this.activeTab.set(tab);
  }
  
  closeCreateModal() {
    this.showCreateModal.set(false);
  }
  
  openDetailModal(announcement: Announcement) {
    this.selectedAnnouncement.set(announcement);
    this.showDetailModal.set(true);
  }
  
  closeDetailModal() {
    this.showDetailModal.set(false);
    this.selectedAnnouncement.set(null);
  }
  
  toggleForm() {
    this.showForm.set(!this.showForm());
  }
}