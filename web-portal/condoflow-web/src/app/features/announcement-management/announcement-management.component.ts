import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { AnnouncementService } from '../../core/services/announcement.service';
import { NavbarComponent } from '../../shared/components/navbar.component';

@Component({
  selector: 'app-announcement-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  template: `
    <div class="management-layout">
      <app-navbar></app-navbar>

      <div class="main-content">
        <div class="content-grid">
          <!-- Formulario para crear anuncio -->
          <div class="create-section">
            <div class="section-header-card">
              <h1><i class="pi pi-megaphone" style="color: #2563EB;"></i> Comunicados</h1>
              <p>Crear y administrar comunicados para los propietarios</p>
            </div>
            <div class="section-card">
              <h2>Crear Comunicado</h2>
              <form [formGroup]="announcementForm" (ngSubmit)="onCreateAnnouncement()">
                <div class="form-group">
                  <label for="title">Título del Comunicado *</label>
                  <input type="text" id="title" formControlName="title" class="form-input" placeholder="Ej: Asamblea General de Propietarios">
                </div>
                
                <div class="form-group">
                  <label for="content">Contenido *</label>
                  <textarea id="content" formControlName="content" class="form-textarea" rows="6" placeholder="Describe el comunicado detalladamente..."></textarea>
                </div>
                
                <div class="form-group">
                  <label for="eventDate">Fecha del Evento (Opcional)</label>
                  <input type="datetime-local" id="eventDate" formControlName="eventDate" class="form-input">
                </div>
                
                <div class="form-group">
                  <label for="isUrgent" class="checkbox-container">
                    <input type="checkbox" id="isUrgent" formControlName="isUrgent" class="checkbox-input">
                    <span class="checkbox-custom"></span>
                    <span class="checkbox-text">Marcar como urgente</span>
                  </label>
                  <small class="form-hint">Los comunicados urgentes se destacan y envían notificaciones inmediatas</small>
                </div>
                
                <button type="submit" class="btn-primary" [disabled]="announcementForm.invalid || creating()">
                  @if (creating()) {
                    <div class="spinner-sm"></div>
                    Publicando...
                  } @else {
                    <i class="pi pi-send"></i>
                    Publicar Comunicado
                  }
                </button>
              </form>
            </div>
          </div>

          <!-- Lista de anuncios existentes -->
          <div class="list-section">
            <div class="section-card">
              <div class="section-header">
                <h2>Comunicados Publicados</h2>
                <span class="count-badge">{{ announcements().length }} comunicados</span>
              </div>
              
              @if (loading()) {
                <div class="loading-state">
                  <div class="spinner"></div>
                  <p>Cargando comunicados...</p>
                </div>
              } @else if (announcements().length === 0) {
                <div class="empty-state">
                  <i class="pi pi-info-circle"></i>
                  <p>No hay comunicados publicados</p>
                </div>
              } @else {
                <div class="announcements-list">
                  @for (announcement of paginatedAnnouncements(); track announcement.id) {
                    <div class="announcement-item" [class.urgent]="announcement.isUrgent" [class.event]="announcement.eventDate && !announcement.isUrgent">
                      <div class="announcement-header">
                        <h3>{{ announcement.title }}</h3>
                        <div class="announcement-actions">
                          @if (announcement.isUrgent) {
                            <span class="type-badge urgent">URGENTE</span>
                          } @else if (announcement.eventDate) {
                            <span class="type-badge event">EVENTO</span>
                          } @else {
                            <span class="type-badge info">INFORMATIVO</span>
                          }
                          <button class="btn-delete" (click)="openDeleteModal(announcement)" title="Eliminar">
                            <i class="pi pi-trash"></i>
                          </button>
                        </div>
                      </div>
                      @if (announcement.eventDate) {
                        <div class="event-date-info">
                          <i class="pi pi-calendar"></i>
                          <strong>Evento:</strong>
                          <span>{{ announcement.eventDate | date:'dd/MM/yyyy HH:mm' }}</span>
                        </div>
                      }
                      <p class="announcement-preview">{{ announcement.content.substring(0, 150) }}{{ announcement.content.length > 150 ? '...' : '' }}</p>
                      <div class="announcement-meta">
                        <span class="date">Publicado: {{ announcement.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                      </div>
                    </div>
                  }
                </div>
                
                <!-- Paginación -->
                @if (getTotalPages() > 1) {
                  <div class="pagination">
                    <button class="pagination-btn" 
                            [disabled]="currentPage() === 1" 
                            (click)="goToPage(currentPage() - 1)">
                      <i class="pi pi-chevron-left"></i>
                    </button>
                    
                    @for (page of getPageNumbers(); track page) {
                      <button class="pagination-btn" 
                              [class.active]="page === currentPage()" 
                              (click)="goToPage(page)">
                        {{ page }}
                      </button>
                    }
                    
                    <button class="pagination-btn" 
                            [disabled]="currentPage() === getTotalPages()" 
                            (click)="goToPage(currentPage() + 1)">
                      <i class="pi pi-chevron-right"></i>
                    </button>
                  </div>
                }
              }
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de confirmación -->
    @if (showDeleteModal()) {
      <div class="modal-backdrop" (click)="closeDeleteModal()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="pi pi-exclamation-triangle text-warning me-2"></i>
                Eliminar Comunicado
              </h5>
            </div>
            <div class="modal-body">
              <p>¿Estás seguro de que deseas eliminar este comunicado?</p>
              @if (announcementToDelete()) {
                <div class="announcement-info-card">
                  <div class="d-flex align-items-center justify-content-between">
                    <div>
                      <div class="fw-semibold">{{ announcementToDelete()?.title }}</div>
                      <small class="text-muted">{{ announcementToDelete()?.content.substring(0, 50) }}{{ announcementToDelete()?.content.length > 50 ? '...' : '' }}</small>
                    </div>
                    <div class="text-end">
                      @if (announcementToDelete()?.isUrgent) {
                        <span class="badge bg-danger">URGENTE</span>
                      } @else if (announcementToDelete()?.eventDate) {
                        <span class="badge bg-warning">EVENTO</span>
                      } @else {
                        <span class="badge bg-success">INFORMATIVO</span>
                      }
                    </div>
                  </div>
                </div>
              }
              <p class="text-muted small mt-3">Esta acción no se puede deshacer.</p>
            </div>
            <div class="modal-footer">
              <button 
                type="button" 
                class="btn btn-outline-secondary modal-btn"
                (click)="closeDeleteModal()">
                Cancelar
              </button>
              <button 
                type="button" 
                class="btn btn-outline-danger modal-btn"
                (click)="confirmDelete()">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .management-layout { min-height: 100vh; background: #f8fafc; width: 100%; }

    .main-content { padding: 2rem; margin: 0; width: 100%; box-sizing: border-box; }
    .page-header { margin-bottom: 2rem; text-align: left; width: 100%; }

    .header-content { text-align: left; width: 100%; }
    .header-content h1 { font-size: 2rem; font-weight: 700; color: #1f2937; margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 0.75rem; }
    .header-content p { color: #6b7280; margin: 0; }

    .content-grid { display: grid; grid-template-columns: 400px 1fr; gap: 2rem; width: 100%; }
    .section-header-card { margin-bottom: 2rem; }
    .section-header-card h1 { font-size: 2rem; font-weight: 700; color: #1f2937; margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 0.75rem; }
    .section-header-card p { color: #6b7280; margin: 0; }
    .section-card { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .section-header h2 { margin: 0; font-size: 1.25rem; font-weight: 600; color: #1f2937; }
    .count-badge { background: #f3f4f6; color: #6b7280; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }

    .form-group { margin-bottom: 1.5rem; }
    .form-group label:not(.checkbox-container) { display: block; font-weight: 500; color: #374151; margin-bottom: 0.5rem; font-size: 0.875rem; }
    .form-input, .form-textarea { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; transition: border-color 0.2s ease; }
    .form-input:focus, .form-textarea:focus { outline: none; border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
    .form-textarea { resize: vertical; min-height: 120px; }
    .form-hint { color: #6b7280; font-size: 0.75rem; margin-top: 0.25rem; }

    .checkbox-container { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: 500; color: #374151; }
    .checkbox-input { display: none; }
    .checkbox-custom { width: 1.25rem; height: 1.25rem; border: 2px solid #d1d5db; border-radius: 4px; position: relative; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .checkbox-text { line-height: 1.25rem; }
    .checkbox-input:checked + .checkbox-custom { background: #2563EB; border-color: #2563EB; }
    .checkbox-input:checked + .checkbox-custom:after { content: '✓'; color: white; font-size: 0.875rem; font-weight: bold; }

    .btn-primary { background: #2563EB; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 0.5rem; width: 100%; justify-content: center; }
    .btn-primary:hover:not(:disabled) { background: #1d4ed8; }
    .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; background: #2563EB; }
    .spinner-sm { width: 1rem; height: 1rem; border: 2px solid transparent; border-top: 2px solid currentColor; border-radius: 50%; animation: spin 1s linear infinite; }

    .loading-state, .empty-state { text-align: center; padding: 2rem; color: #6b7280; }
    .spinner { width: 2rem; height: 2rem; border: 2px solid #e5e7eb; border-top: 2px solid #2563EB; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem auto; }
    .empty-state i { font-size: 2rem; margin-bottom: 0.5rem; color: #9ca3af; }

    .announcements-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
    .announcement-item { padding: 1.5rem; border: 1px solid #e5e7eb; border-radius: 12px; transition: all 0.2s ease; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .announcement-item:hover { transform: translateY(-4px); box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15); }
    .announcement-item.urgent { border-left: 4px solid #ef4444; background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%); }
    .announcement-item.event { border-left: 4px solid #f59e0b; background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%); }
    .announcement-item:not(.urgent):not(.event) { border-left: 4px solid #10b981; background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%); }

    .announcement-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
    .announcement-header h3 { margin: 0; font-size: 1rem; font-weight: 600; color: #1f2937; }
    .announcement-actions { display: flex; align-items: center; gap: 0.5rem; }
    .type-badge { padding: 0.35rem 0.65rem; border-radius: 0.5rem; font-size: 0.75rem; font-weight: 400; border: 1px solid; }
    .type-badge.urgent { background: #fee2e2; color: #991b1b; border-color: #ef4444; }
    .type-badge.event { background: #fef3c7; color: #92400e; border-color: #f59e0b; }
    .type-badge.info { background: #d1fae5; color: #065f46; border-color: #10b981; }
    .btn-delete { background: #fee2e2; color: #dc2626; border: none; width: 2rem; height: 2rem; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; }
    .btn-delete:hover { background: #fecaca; }

    .event-date-info { display: flex; align-items: center; gap: 0.5rem; background: #fef3c7; color: #92400e; padding: 0.5rem; border-radius: 6px; margin: 0.5rem 0; font-size: 0.875rem; font-weight: 500; }
    .event-date-info i { color: #f59e0b; }
    .announcement-preview { color: #6b7280; margin: 0 0 0.75rem 0; font-size: 0.875rem; line-height: 1.4; }
    .announcement-meta .date { color: #9ca3af; font-size: 0.75rem; }

    .pagination { display: flex; justify-content: center; align-items: center; gap: 0.5rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb; }
    .pagination-btn { background: white; border: 1px solid #d1d5db; color: #6b7280; width: 2.5rem; height: 2.5rem; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; font-weight: 500; }
    .pagination-btn:hover:not(:disabled) { border-color: #2563EB; color: white; background: #2563EB; }
    .pagination-btn.active { background: #2563EB; border-color: #2563EB; color: white; }
    .pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Modal */
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1050; }
    .modal-dialog { max-width: 400px; width: 90%; }
    .modal-content { background: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
    .modal-header { padding: 1rem 1.5rem; border-bottom: 1px solid #dee2e6; }
    .modal-title { margin: 0; font-weight: 600; }
    .modal-body { padding: 1.5rem; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #dee2e6; display: flex; gap: 0.5rem; justify-content: flex-end; }
    .text-warning { color: #f59e0b; }
    .me-2 { margin-right: 0.5rem; }
    .announcement-info-card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 1rem; margin-top: 1rem; }
    .d-flex { display: flex; }
    .align-items-center { align-items: center; }
    .justify-content-between { justify-content: space-between; }
    .fw-semibold { font-weight: 600; }
    .text-muted { color: #6b7280; }
    .text-end { text-align: right; }
    .small { font-size: 0.875rem; }
    .mt-3 { margin-top: 1rem; }
    .modal-btn { min-width: 100px; font-weight: 400; padding: 0.5rem 1rem; border-radius: 6px; transition: all 0.2s ease; }
    .btn-outline-secondary { border-color: #6b7280; color: #6b7280; }
    .btn-outline-secondary:hover:not(:disabled) { background: #6b7280; color: white; transform: translateY(-1px); box-shadow: 0 2px 8px rgba(107, 114, 128, 0.2); }
    .btn-outline-danger { border-color: #ef4444; color: #ef4444; }
    .btn-outline-danger:hover:not(:disabled) { background: #ef4444; color: white; transform: translateY(-1px); box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2); }
    .badge { padding: 0.35rem 0.65rem; border-radius: 0.5rem; font-size: 0.75rem; font-weight: 400; border: 1px solid; }
    .bg-danger { background: #fee2e2 !important; color: #991b1b !important; border-color: #ef4444 !important; }
    .bg-warning { background: #fef3c7 !important; color: #92400e !important; border-color: #f59e0b !important; }
    .bg-success { background: #d1fae5 !important; color: #065f46 !important; border-color: #10b981 !important; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    @media (max-width: 1024px) {
      .content-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AnnouncementManagementComponent implements OnInit {
  currentUser = signal<any>(null);
  announcements = signal<any[]>([]);
  loading = signal(true);
  creating = signal(false);
  
  // Paginación
  currentPage = signal(1);
  itemsPerPage = 4;
  paginatedAnnouncements = signal<any[]>([]);
  
  // Modal de confirmación
  showDeleteModal = signal(false);
  announcementToDelete = signal<any>(null);
  
  announcementForm: FormGroup;

  constructor(
    private authService: AuthService,
    private router: Router,
    private announcementService: AnnouncementService,
    private fb: FormBuilder
  ) {
    this.announcementForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.maxLength(2000)]],
      eventDate: [''],
      isUrgent: [false]
    });
  }

  ngOnInit() {
    this.currentUser.set(this.authService.currentUser());
    this.loadAnnouncements();
  }

  loadAnnouncements() {
    this.announcementService.getAnnouncements().subscribe({
      next: (response) => {
        if (response.success) {
          this.announcements.set(response.data || []);
          this.updatePaginatedAnnouncements();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando anuncios:', error);
        this.announcements.set([]);
        this.loading.set(false);
      }
    });
  }

  updatePaginatedAnnouncements() {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedAnnouncements.set(this.announcements().slice(startIndex, endIndex));
  }

  getTotalPages(): number {
    return Math.ceil(this.announcements().length / this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage.set(page);
      this.updatePaginatedAnnouncements();
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
            this.currentPage.set(1); // Volver a la primera página
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

  openDeleteModal(announcement: any) {
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
          // Ajustar página si es necesario
          const totalPages = Math.ceil((this.announcements().length - 1) / this.itemsPerPage);
          if (this.currentPage() > totalPages && totalPages > 0) {
            this.currentPage.set(totalPages);
          }
          this.loadAnnouncements();
          this.closeDeleteModal();
          // Notificar a todos los usuarios sobre la eliminación
          this.notifyAnnouncementDeleted(announcement.id);
        }
      },
      error: (error) => {
        console.error('Error eliminando anuncio:', error);
        this.showErrorMessage('Error al eliminar el comunicado');
        this.closeDeleteModal();
      }
    });
  }

  private notifyAnnouncementDeleted(announcementId: string) {
    // El SignalR ya maneja esto automáticamente cuando se elimina del backend
    console.log('Comunicado eliminado:', announcementId);
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
}