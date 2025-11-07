import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IncidentService } from '../../core/services/incident.service';
import { NavbarComponent } from '../../shared/components/navbar.component';

@Component({
  selector: 'app-my-incidents',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <div class="profile-layout">
      <app-navbar></app-navbar>

      <div class="main-content">
        <div class="container-fluid">
          <div class="row mb-2">
            <div class="col-12">
              <div class="d-flex align-items-center bg-light p-2 rounded shadow-sm">
                <div class="me-2">
                  <i class="pi pi-wrench" style="font-size: 1.5rem; color: #2563EB;"></i>
                </div>
                <div>
                  <h4 class="mb-0 fw-bold">Mis Incidencias <small class="text-muted fw-normal">- Reporta y da seguimiento</small></h4>
                </div>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col-lg-4 col-md-12 mb-3">
              <div class="card">
                <div class="card-header bg-white">
                  <h5 class="mb-0 text-dark"><i class="pi pi-plus me-2"></i>Reportar Incidencia</h5>
                </div>
                <div class="card-body">
                  <form (ngSubmit)="createIncident()">
                    <div class="mb-2">
                      <label class="form-label fw-bold">Categoría</label>
                      <select 
                        [(ngModel)]="selectedCategory" 
                        name="category"
                        class="form-select form-select-lg">
                        <option value="">Selecciona una categoría</option>
                        @for (category of categories; track category.value) {
                          <option [value]="category.value">{{ category.label }}</option>
                        }
                      </select>
                    </div>
                    
                    <div class="mb-2">
                      <label class="form-label fw-bold">Prioridad</label>
                      <select 
                        [(ngModel)]="selectedPriority" 
                        name="priority"
                        class="form-select form-select-lg">
                        <option value="">¿Qué tan urgente es?</option>
                        @for (priority of priorities; track priority.value) {
                          <option [value]="priority.value">{{ priority.label }}</option>
                        }
                      </select>
                    </div>
                    
                    <div class="mb-2">
                      <label class="form-label fw-bold">Título</label>
                      <input 
                        type="text" 
                        [(ngModel)]="title" 
                        name="title"
                        class="form-control form-control-lg"
                        placeholder="Describe brevemente el problema">
                    </div>
                    
                    <div class="mb-2">
                      <label class="form-label fw-bold">Descripción</label>
                      <textarea 
                        [(ngModel)]="description" 
                        name="description"
                        class="form-control" 
                        rows="2" 
                        placeholder="Describe detalladamente el problema...">
                      </textarea>
                    </div>
                    
                    <div class="mb-3">
                      <label class="form-label fw-bold">Foto (Opcional)</label>
                      <div class="modern-file-upload" [class.has-file]="selectedFile">
                        <div class="file-drop-zone" (click)="triggerFileInput()">
                          @if (!selectedFile) {
                            <div class="upload-placeholder">
                              <i class="pi pi-cloud-upload"></i>
                              <span class="upload-text">Arrastra tu imagen aquí o <strong>haz clic para seleccionar</strong></span>
                              <span class="upload-hint">JPG, PNG - Máx. 5MB</span>
                            </div>
                          } @else {
                            <div class="file-preview">
                              <i class="pi pi-image"></i>
                              <div class="file-info">
                                <span class="file-name">{{ selectedFile.name }}</span>
                                <span class="file-size">{{ getFileSize(selectedFile.size) }}</span>
                              </div>
                              <button type="button" class="remove-file" (click)="removeFile($event)">
                                <i class="pi pi-times"></i>
                              </button>
                            </div>
                          }
                        </div>
                        <input type="file" #fileInput id="incidentImage" (change)="onFileSelected($event)" accept="image/*" style="display: none;">
                      </div>
                    </div>
                    
                    <button 
                      type="submit" 
                      class="btn btn-primary btn-lg w-100"
                      [disabled]="!selectedCategory || !selectedPriority || !title || !description || loading()">
                      <i class="pi pi-send me-2"></i>
                      {{ loading() ? 'Enviando...' : 'Reportar Incidencia' }}
                    </button>
                  </form>
                </div>
              </div>
            </div>
            
            <div class="col-lg-8 col-md-12">
              <div class="card" style="height: calc(100% - 20px);">
                <div class="card-header bg-white">
                  <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
                    <h5 class="mb-0 text-dark"><i class="pi pi-list me-2"></i>Mis Incidencias Reportadas</h5>
                    <div class="d-flex flex-wrap gap-2">
                      <div class="text-center">
                        <div class="badge bg-warning text-dark fw-bold">{{ statusCounts().reported }}</div>
                        <div><small class="text-muted">Reportadas</small></div>
                      </div>
                      <div class="text-center">
                        <div class="badge bg-info text-white fw-bold">{{ statusCounts().inProgress }}</div>
                        <div><small class="text-muted">En Proceso</small></div>
                      </div>
                      <div class="text-center">
                        <div class="badge bg-success text-white fw-bold">{{ statusCounts().resolved }}</div>
                        <div><small class="text-muted">Resueltas</small></div>
                      </div>
                      <div class="text-center">
                        <div class="badge bg-secondary text-white fw-bold">{{ statusCounts().cancelled }}</div>
                        <div><small class="text-muted">Canceladas</small></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="card-body d-flex flex-column" style="height: calc(100vh - 250px);">
                  @if (incidents().length === 0) {
                    <div class="text-center py-5 flex-grow-1 d-flex flex-column justify-content-center">
                      <i class="pi pi-wrench" style="font-size: 4rem; color: #6c757d;"></i>
                      <h6 class="text-muted mt-3">No has reportado incidencias</h6>
                      <p class="text-muted small">Reporta cualquier problema que encuentres en el condominio</p>
                    </div>
                  } @else {
                    <div class="table-responsive" style="flex: 1; overflow-y: auto; min-height: 0;">
                      <table class="table table-striped table-sm">
                        <thead class="sticky-top bg-white">
                          <tr>
                            <th>Fecha</th>
                            <th>Título</th>
                            <th>Descripción</th>
                            <th>Estado</th>
                            <th class="text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (incident of paginatedIncidents(); track incident.id) {
                            <tr>
                              <td>{{ incident.createdAt | date:'dd/MM/yyyy' }}</td>
                              <td>
                                <div style="word-break: break-word; white-space: normal;">{{ incident.title }}</div>
                              </td>
                              <td>
                                <div class="description-text">{{ incident.description }}</div>
                              </td>
                              <td>
                                <span 
                                  class="badge status-badge"
                                  [class]="'bg-' + getOwnerStatusSeverity(incident)">
                                  {{ getOwnerStatusLabel(incident) }}
                                </span>
                              </td>
                              <td class="text-center">
                                <div class="d-flex align-items-center justify-content-center gap-1">
                                  <button 
                                    class="btn-detail-compact"
                                    (click)="viewIncidentDetail(incident)"
                                    title="Ver detalle">
                                    <i class="pi pi-eye"></i>
                                  </button>
                                  @if (incident.status === 'reported') {
                                    <button 
                                      class="btn-cancel-elegant"
                                      (click)="openCancelModal(incident.id)"
                                      title="Cancelar incidencia">
                                      <i class="pi pi-times"></i>
                                    </button>
                                  } @else if (incident.status === 'rejected') {
                                    <div class="status-icon-simple cancelled-admin" title="Rechazada por administrador">
                                      <i class="pi pi-times-circle"></i>
                                    </div>
                                  } @else if (incident.status === 'cancelled') {
                                    <div class="status-icon-simple cancelled-owner" title="Cancelada por propietario">
                                      <i class="pi pi-ban"></i>
                                    </div>
                                  } @else if (incident.status === 'resolved') {
                                    <div class="status-icon-simple resolved" title="Incidencia resuelta">
                                      <i class="pi pi-check-circle"></i>
                                    </div>
                                  } @else if (incident.status === 'in_progress') {
                                    <div class="status-icon-simple in-progress" title="En proceso">
                                      <i class="pi pi-clock"></i>
                                    </div>
                                  } @else {
                                    <span class="text-muted">—</span>
                                  }
                                </div>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                    
                    @if (totalPages() > 1) {
                      <div class="d-flex justify-content-between align-items-center pt-2 border-top" style="margin-top: 2px;">
                        <div>
                          <small class="text-muted">
                            Mostrando {{ (currentPage() - 1) * pageSize + 1 }} - {{ Math.min(currentPage() * pageSize, incidents().length) }} de {{ incidents().length }} incidencias
                          </small>
                        </div>
                        <nav>
                          <div class="pagination">
                            <button 
                              class="pagination-btn" 
                              [disabled]="currentPage() === 1"
                              (click)="goToPage(currentPage() - 1)">
                              <i class="pi pi-chevron-left"></i>
                            </button>
                            
                            @for (page of getPageNumbers(); track page) {
                              @if (page === '...') {
                                <span class="pagination-dots">...</span>
                              } @else {
                                <button 
                                  class="pagination-btn"
                                  [class.active]="page === currentPage()"
                                  (click)="goToPage($any(page))">
                                  {{ page }}
                                </button>
                              }
                            }
                            
                            <button 
                              class="pagination-btn" 
                              [disabled]="currentPage() === totalPages()"
                              (click)="goToPage(currentPage() + 1)">
                              <i class="pi pi-chevron-right"></i>
                            </button>
                          </div>
                        </nav>
                      </div>
                    }
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Detalle -->
    @if (showDetailModal()) {
      <div class="modal-backdrop" (click)="showDetailModal.set(false)">
        <div class="modal-dialog modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="pi pi-info-circle me-2" style="color: #6c757d;"></i>
                Detalle de Incidencia
              </h5>
              <button type="button" class="btn-close" (click)="showDetailModal.set(false)">
                <i class="pi pi-times"></i>
              </button>
            </div>
            <div class="modal-body">
              @if (selectedIncident()) {
                <div class="incident-detail-card">
                  <div class="detail-header">
                    <h5 class="incident-title">{{ selectedIncident().title }}</h5>
                    <div class="incident-badges mt-3">
                      <span class="badge" [class]="'bg-' + getStatusSeverity(selectedIncident().status)">{{ getStatusLabel(selectedIncident().status) }}</span>
                      <span class="badge" [class]="'bg-' + getPrioritySeverity(selectedIncident().priority)">{{ getPriorityLabel(selectedIncident().priority) }}</span>
                      <span class="badge bg-secondary">{{ getCategoryLabel(selectedIncident().category) }}</span>
                    </div>
                  </div>
                  
                  <div class="detail-body">

                    
                    @if (selectedIncident().imageUrl) {
                      <div class="image-section">
                        <label class="detail-label"><i class="pi pi-image me-2"></i>Imagen adjunta</label>
                        <button class="btn btn-outline-primary btn-sm" (click)="viewImage(selectedIncident())">
                          <i class="pi pi-image me-2"></i>Ver imagen
                        </button>
                      </div>
                    }
                    
                    @if (selectedIncident().adminComment && selectedIncident().status === 'cancelled') {
                      <div class="admin-comment-section">
                        <label class="detail-label"><i class="pi pi-comment me-2"></i>Motivo de Cancelación</label>
                        <div class="admin-comment-content">{{ selectedIncident().adminComment }}</div>

                      </div>
                    }
                    
                    <div class="incident-date-footer">
                      <small class="text-muted"><i class="pi pi-calendar me-1" style="color: #f59e0b;"></i>Reportado el {{ selectedIncident().createdAt | date:'dd/MM/yyyy HH:mm' }}</small>
                      @if (selectedIncident().status === 'cancelled' && selectedIncident().updatedAt) {
                        <br><small class="text-muted"><i class="pi pi-times me-1" style="color: #dc2626;"></i>Cancelado el {{ selectedIncident().updatedAt | date:'dd/MM/yyyy HH:mm' }}</small>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" (click)="showDetailModal.set(false)">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Modal de Cancelación -->
    @if (showCancelModal()) {
      <div class="modal-backdrop" (click)="showCancelModal.set(false)">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="pi pi-exclamation-triangle text-warning me-2"></i>
                Cancelar Incidencia
              </h5>
            </div>
            <div class="modal-body">
              <p>¿Estás seguro de que deseas cancelar esta incidencia?</p>
              @if (incidentToCancel()) {
                <div class="incident-info-card">
                  <div>
                    <div class="fw-semibold mb-2">{{ incidentToCancel().title }}</div>
                    <div class="d-flex justify-content-between">
                      <small class="text-muted">{{ getCategoryLabel(incidentToCancel().category) }}</small>
                      <small class="text-muted">{{ incidentToCancel().createdAt | date:'dd/MM/yyyy' }} - {{ getPriorityLabel(incidentToCancel().priority) }}</small>
                    </div>
                  </div>
                </div>
              }
              <div class="form-group mt-3">
                <label for="ownerComment">Motivo de cancelación</label>
                <textarea id="ownerComment" [(ngModel)]="ownerCancelComment" class="form-control" rows="3" placeholder="Explica por qué cancelas esta incidencia..."></textarea>
              </div>
              <p class="text-muted small mt-3">Esta acción no se puede deshacer.</p>
            </div>
            <div class="modal-footer">
              <button 
                type="button" 
                class="btn btn-outline-secondary modal-btn"
                (click)="showCancelModal.set(false)">
                No, mantener
              </button>
              <button 
                type="button" 
                class="btn btn-outline-danger modal-btn"
                (click)="cancelIncident()"
                [disabled]="cancelling() || !ownerCancelComment.trim()">
                {{ cancelling() ? 'Cancelando...' : 'Sí, cancelar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .profile-layout { min-height: 100vh; background: #f8fafc; }
    .main-content { width: 100%; padding: 1rem; }
    .card { border: none; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 1rem; }
    .card-header { background: #f8f9fa; border-bottom: 1px solid #dee2e6; }
    .table-responsive { overflow: visible; }
    .table th, .table td { padding: 0.5rem 0.25rem; font-size: 0.875rem; }
    .table th:nth-child(2), .table td:nth-child(2) { white-space: normal; width: 30%; }
    .table th:nth-child(3), .table td:nth-child(3) { white-space: normal; width: 35%; }
    .table th:nth-child(1) { width: 12%; }
    .table th:nth-child(4) { width: 10%; }
    .table th:nth-child(5) { width: 13%; }
    
    :host ::ng-deep .badge {
      font-weight: 400 !important;
      font-size: 0.75rem !important;
      padding: 0.35rem 0.65rem !important;
      border-radius: 0.5rem !important;
    }

    .status-badge {
      min-width: 85px !important;
      text-align: center !important;
      display: inline-block !important;
    }

    .btn-cancel-elegant {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #92400e;
      border: 1px solid #f59e0b;
      width: 2.2rem;
      height: 2.2rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(146, 64, 14, 0.1);
    }

    .btn-cancel-elegant:hover {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }

    .btn-cancel-elegant:active {
      transform: translateY(0);
      box-shadow: 0 2px 6px rgba(220, 38, 38, 0.2);
    }

    .status-icon-simple {
      width: 2.2rem;
      height: 2.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }

    .status-icon-simple.in-progress {
      color: #1e40af;
    }

    .status-icon-simple.resolved {
      color: #059669;
    }

    .status-icon-simple.cancelled-admin {
      color: #dc2626;
    }

    .status-icon-simple.cancelled-owner {
      color: #64748b;
    }

    :host ::ng-deep .bg-warning {
      background-color: #fef3c7 !important;
      color: #92400e !important;
      border: 1px solid #f59e0b;
    }

    :host ::ng-deep .bg-info {
      background-color: #dbeafe !important;
      color: #1e40af !important;
      border: 1px solid #3b82f6;
    }

    :host ::ng-deep .bg-success {
      background-color: #d1fae5 !important;
      color: #065f46 !important;
      border: 1px solid #10b981;
    }

    :host ::ng-deep .bg-danger {
      background-color: #fee2e2 !important;
      color: #991b1b !important;
      border: 1px solid #ef4444;
    }

    :host ::ng-deep .bg-secondary {
      background-color: #f1f5f9 !important;
      color: #475569 !important;
      border: 1px solid #94a3b8;
    }

    /* Modern File Upload Styles */
    .modern-file-upload {
      margin-top: 0.5rem;
    }

    .file-drop-zone {
      border: 2px dashed #d1d5db;
      border-radius: 8px;
      padding: 0.5rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
      background: #fafafa;
    }

    .file-drop-zone:hover {
      border-color: #2563EB;
      background: #f8faff;
    }

    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .upload-placeholder i {
      font-size: 2rem;
      color: #9ca3af;
    }

    .upload-text {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .upload-hint {
      color: #9ca3af;
      font-size: 0.75rem;
    }

    .file-preview {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem;
      background: white;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }

    .file-preview i {
      font-size: 1.5rem;
      color: #2563EB;
    }

    .file-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .file-name {
      font-weight: 500;
      color: #1f2937;
      font-size: 0.875rem;
    }

    .file-size {
      color: #6b7280;
      font-size: 0.75rem;
    }

    .remove-file {
      background: #fee2e2;
      color: #dc2626;
      border: none;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .remove-file:hover {
      background: #fecaca;
    }

    .modern-file-upload.has-file .file-drop-zone {
      border-color: #10b981;
      background: #f0fdf4;
    }

    /* Laptop Styles (1024px - 1366px) */
    @media (max-width: 1366px) and (min-width: 1024px) {
      .main-content {
        padding: 0.75rem;
      }
      

      
      .form-control, .form-select {
        padding: 0.375rem 0.5rem;
        font-size: 0.875rem;
      }
      
      .btn {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
      }
      
      .table th, .table td {
        padding: 0.4rem 0.3rem;
        font-size: 0.8rem;
      }
      
      .badge {
        font-size: 0.7rem !important;
        padding: 0.3rem 0.6rem !important;
      }
      
      .mb-2 {
        margin-bottom: 0.5rem !important;
      }
      
      .mb-3 {
        margin-bottom: 0.75rem !important;
      }
    }
    
    /* Tablet Styles */
    @media (max-width: 1023px) and (min-width: 768px) {
      .card-body {
        height: 300px !important;
      }
      
      .form-control, .form-select {
        padding: 0.3rem 0.4rem;
        font-size: 0.8rem;
      }
      
      .table th, .table td {
        padding: 0.3rem 0.2rem;
        font-size: 0.75rem;
      }
    }
    
    /* Mobile Styles */
    @media (max-width: 767px) {
      .main-content {
        padding: 0.5rem;
      }
      
      .card-body {
        height: 250px !important;
      }
      
      .form-control, .form-select {
        padding: 0.25rem 0.3rem;
        font-size: 0.75rem;
      }
      
      .btn {
        padding: 0.4rem 0.8rem;
        font-size: 0.8rem;
      }
      
      .table th, .table td {
        padding: 0.25rem 0.15rem;
        font-size: 0.7rem;
      }
      
      .badge {
        font-size: 0.65rem !important;
        padding: 0.2rem 0.4rem !important;
      }
      
      .action-btn {
        min-width: 70px;
        font-size: 0.7rem;
        padding: 0.2rem 0.4rem;
      }
    }

    /* Modal Styles */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
    }

    .modal-dialog {
      max-width: 500px;
      width: 90%;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }

    .modal-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #dee2e6;
    }

    .modal-title {
      margin: 0;
      font-weight: 600;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #dee2e6;
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .incident-info-card {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      padding: 1rem;
      margin-top: 1rem;
    }

    .modal-btn {
      min-width: 100px;
      font-weight: 400;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .btn-outline-secondary {
      border-color: #6b7280;
      color: #6b7280;
    }

    .btn-outline-secondary:hover:not(:disabled) {
      background: #6b7280;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(107, 114, 128, 0.2);
    }

    .btn-outline-danger {
      border-color: #ef4444;
      color: #ef4444;
    }

    .btn-outline-danger:hover:not(:disabled) {
      background: #ef4444;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
    }

    /* Action Buttons */
    .action-btn {
      padding: 0.375rem 0.5rem;
      border: 1px solid transparent;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 400;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      text-decoration: none;
      justify-content: center;
      min-width: 100px;
    }

    .reject-btn {
      background: transparent;
      color: #ef4444;
      border: 1px solid #ef4444;
    }

    .reject-btn:hover:not(:disabled) {
      background: #ef4444;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
    }

    .action-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .action-btn i {
      font-size: 0.75rem;
    }

    .btn-detail-compact {
      background: #f3f4f6;
      color: #6b7280;
      border: none;
      min-width: 2.5rem;
      height: 2.5rem;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-detail-compact:hover {
      background: #e5e7eb;
      color: #374151;
    }

    .btn-close {
      background: transparent;
      border: none;
      color: #6b7280;
      cursor: pointer;
      padding: 0.5rem;
    }

    .modal-lg {
      max-width: 650px;
    }

    .incident-detail-card {
      background: #f8fafc;
      border-radius: 12px;
      overflow: hidden;
    }

    .detail-header {
      background: white;
      padding: 1rem 1.5rem 1.5rem 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .incident-title {
      color: #1f2937;
      font-weight: 600;
      margin: 0;
      line-height: 1.4;
      word-wrap: break-word;
      overflow-wrap: break-word;
      white-space: normal;
    }

    .incident-badges {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-top: 1rem;
    }

    .incident-date-footer {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }

    .detail-body {
      padding: 1.5rem;
    }

    .description-section, .image-section {
      margin-bottom: 1.5rem;
    }

    .detail-label {
      display: block;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.75rem;
      font-size: 0.875rem;
    }

    .description-content {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      color: #1f2937;
      line-height: 1.6;
      font-size: 0.95rem;
    }

    .admin-comment-section {
      margin-bottom: 1.5rem;
    }

    .admin-comment-content {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      color: #1f2937;
      line-height: 1.6;
      font-size: 0.95rem;
      font-style: italic;
    }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .pagination-btn {
      padding: 0.5rem 0.75rem;
      border: 1px solid #e5e7eb;
      background: white;
      color: #6b7280;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.875rem;
      min-width: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pagination-btn:hover:not(:disabled) {
      border-color: #2563EB;
      color: #2563EB;
      background: #eff6ff;
    }

    .pagination-btn.active {
      background: #2563EB;
      color: white;
      border-color: #2563EB;
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pagination-dots {
      padding: 0.5rem 0.75rem;
      color: #6b7280;
      font-weight: 500;
    }

    .description-text {
      font-size: 0.8rem;
      color: #374151;
      word-break: break-word;
      white-space: normal;
      max-width: 250px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  `]
})
export class MyIncidentsComponent implements OnInit {
  loading = signal(false);
  incidents = signal<any[]>([]);
  currentPage = signal(1);
  pageSize = 8;
  
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
  
  categories = [
    { label: 'Mantenimiento', value: 'maintenance' },
    { label: 'Áreas Comunes', value: 'common_areas' },
    { label: 'Seguridad', value: 'security' },
    { label: 'Limpieza', value: 'cleaning' },
    { label: 'Ruido/Convivencia', value: 'noise' },
    { label: 'Sugerencias', value: 'suggestions' }
  ];
  
  priorities = [
    { label: '🔴 Crítica/Urgente', value: 'critical' },
    { label: '🟡 Alta', value: 'high' },
    { label: '🟢 Media', value: 'medium' },
    { label: '🔵 Baja', value: 'low' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private incidentService: IncidentService
  ) {}

  ngOnInit() {
    this.loadIncidents();
  }

  loadIncidents() {
    this.incidentService.getMyIncidents().subscribe({
      next: (response) => {
        if (response.success) {
          this.incidents.set(response.data || []);
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

  getCategoryLabel(category: string): string {
    const cat = this.categories.find(c => c.value === category);
    return cat ? cat.label : category;
  }

  getPriorityLabel(priority: string): string {
    const pri = this.priorities.find(p => p.value === priority);
    return pri ? pri.label : priority;
  }

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