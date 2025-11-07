import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IncidentService } from '../../core/services/incident.service';
import { NavbarComponent } from '../../shared/components/navbar.component';

@Component({
  selector: 'app-incident-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <div class="management-layout">
      <app-navbar></app-navbar>

      <div class="main-content">
        <div class="container-fluid">
          <div class="row mb-3">
            <div class="col-12">
              <div class="header-card">
                <div class="header-content">
                  <div class="header-info">
                    <div class="header-icon">
                      <i class="pi pi-wrench"></i>
                    </div>
                    <div class="header-text">
                      <h2 class="header-title">Gestión de Incidencias</h2>
                      <p class="header-subtitle">Administra incidencias reportadas en áreas comunes del condominio</p>
                    </div>
                  </div>
                  
                  <div class="filters-section">
                    <div class="filter-group">
                      <div class="filter-item">
                        <label class="filter-label">Estado</label>
                        <select [(ngModel)]="statusFilter" (change)="applyFilters()" class="filter-select">
                          <option value="">Todos</option>
                          <option value="reported">Reportadas</option>
                          <option value="in_progress">En Proceso</option>
                          <option value="resolved">Resueltas</option>
                          <option value="cancelled">Canceladas/Rechazadas</option>
                        </select>
                      </div>
                      
                      <div class="filter-item">
                        <label class="filter-label">Prioridad</label>
                        <select [(ngModel)]="priorityFilter" (change)="applyFilters()" class="filter-select">
                          <option value="">Todas</option>
                          <option value="critical">Crítica</option>
                          <option value="high">Alta</option>
                          <option value="medium">Media</option>
                          <option value="low">Baja</option>
                        </select>
                      </div>
                      
                      <div class="filter-item search-item">
                        <label class="filter-label">Buscar</label>
                        <div class="search-input-wrapper">
                          <i class="pi pi-search search-icon"></i>
                          <input type="text" [(ngModel)]="searchTerm" (input)="applyFilters()" 
                                 class="search-input" placeholder="Título o propietario...">
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="incidents-card">
            <div class="card-header bg-white">
              <div class="d-flex justify-content-between align-items-center">
                <h5 class="mb-0 text-dark"><i class="pi pi-wrench me-2" style="color: #f97316;"></i>Incidencias de Áreas Comunes</h5>
                <div class="d-flex gap-2">
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
                    <div class="badge bg-danger text-white fw-bold">{{ statusCounts().rejected }}</div>
                    <div><small class="text-muted">Rechazadas</small></div>
                  </div>
                  <div class="text-center">
                    <div class="badge bg-secondary text-white fw-bold">{{ statusCounts().cancelled }}</div>
                    <div><small class="text-muted">Canceladas</small></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-body d-flex flex-column" style="height: calc(100vh - 410px);">
              @if (loading()) {
                <div class="text-center py-5 flex-grow-1 d-flex flex-column justify-content-center">
                  <div class="spinner"></div>
                  <p class="text-muted">Cargando incidencias...</p>
                </div>
              } @else if (paginatedIncidents().length === 0) {
                <div class="text-center py-5 flex-grow-1 d-flex flex-column justify-content-center">
                  <i class="pi pi-wrench" style="font-size: 4rem; color: #6c757d;"></i>
                  <h6 class="text-muted mt-3">No hay incidencias</h6>
                  <p class="text-muted small">No hay incidencias reportadas en áreas comunes</p>
                </div>
              } @else {
                <div class="table-responsive" style="flex: 1; overflow-y: auto; min-height: 0;">
                  <table class="table table-striped">
                    <thead class="sticky-top">
                      <tr>
                        <th style="width: 8%;">Fecha</th>
                        <th style="width: 18%;">Propietario</th>
                        <th style="width: 24%;">Título</th>
                        <th style="width: 10%;">Prioridad</th>
                        <th style="width: 10%;">Estado</th>
                        <th style="width: 24%;">Comentarios</th>
                        <th style="width: 6%; text-align: right; padding-right: 1.5rem;">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (incident of paginatedIncidents(); track incident.id) {
                        <tr>
                          <td>{{ incident.createdAt | date:'dd/MM/yyyy' }}</td>
                          <td>
                            <div>{{ incident.ownerName }}</div>
                            <small class="text-muted">{{ incident.apartment }}</small>
                          </td>
                          <td>
                            <div style="word-break: break-word; white-space: normal;">{{ incident.title }}</div>
                          </td>
                          <td>
                            <span class="badge priority-badge" [class]="'bg-' + getPrioritySeverity(incident.priority)" style="font-size: 0.7rem;">
                              {{ getPriorityLabel(incident.priority) }}
                            </span>
                          </td>
                          <td>
                            <span class="badge status-badge" [class]="'bg-' + getStatusSeverity(incident.status)" style="font-size: 0.7rem;">
                              {{ getStatusLabel(incident.status) }}
                            </span>
                          </td>
                          <td>
                            @if (incident.status === 'rejected' && incident.adminComment) {
                              <div style="word-break: break-word; white-space: normal; display: block; font-weight: inherit;">{{ incident.adminComment }}</div>
                            } @else if (incident.status === 'cancelled') {
                              <span>Anulada por propietario →</span>
                            } @else {
                              <span class="text-muted">—</span>
                            }
                          </td>
                          <td style="padding-right: 1.5rem;">
                            <div class="d-flex gap-1 justify-content-end">
                              <button class="btn-receipt-compact" (click)="viewIncidentDetail(incident)" title="Ver detalle">
                                <i class="pi pi-eye"></i>
                              </button>
                              @if (incident.status === 'reported') {
                                <button class="btn-edit-reported" (click)="openStatusModal(incident)" title="Cambiar estado">
                                  <i class="pi pi-pencil"></i>
                                </button>
                              } @else if (incident.status === 'in_progress') {
                                <button class="btn-edit-progress" (click)="openStatusModal(incident)" title="Cambiar estado">
                                  <i class="pi pi-pencil"></i>
                                </button>
                              } @else if (incident.status === 'resolved') {
                                <div class="status-icon-simple resolved" title="Incidencia resuelta">
                                  <i class="pi pi-check-circle"></i>
                                </div>
                              } @else if (incident.status === 'rejected') {
                                <div class="status-icon-simple cancelled-admin" title="Rechazada por administrador">
                                  <i class="pi pi-times-circle"></i>
                                </div>
                              } @else if (incident.status === 'cancelled') {
                                <div class="status-icon-simple cancelled-owner" title="Cancelada por propietario">
                                  <i class="pi pi-ban"></i>
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
                        Mostrando {{ (currentPage() - 1) * pageSize + 1 }} - {{ Math.min(currentPage() * pageSize, filteredIncidents().length) }} de {{ filteredIncidents().length }} incidencias
                      </small>
                    </div>
                    <nav>
                      <div class="pagination">
                        <button class="pagination-btn" [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)">
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
                        <button class="pagination-btn" [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)">
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
                    <div class="owner-section">
                      <label class="detail-label">Propietario</label>
                      <div class="owner-info">
                        <strong>{{ selectedIncident().ownerName }}</strong> | {{ selectedIncident().apartment }}
                      </div>
                    </div>
                    
                    <div class="description-section">
                      <label class="detail-label">Descripción</label>
                      <div class="description-content">{{ selectedIncident().description }}</div>
                    </div>
                    
                    @if (selectedIncident().imageUrl) {
                      <div class="image-section">
                        <label class="detail-label">Imagen adjunta</label>
                        <button class="btn btn-outline-primary btn-sm" (click)="viewImage(selectedIncident())">
                          <i class="pi pi-image me-2"></i>Ver imagen
                        </button>
                      </div>
                    }
                    
                    @if (selectedIncident().status === 'rejected' && selectedIncident().adminComment) {
                      <div class="admin-comment-section">
                        <label class="detail-label">Motivo de Rechazo del Administrador</label>
                        <div class="admin-comment-content">{{ selectedIncident().adminComment }}</div>
                      </div>
                    }
                    
                    @if (selectedIncident().status === 'cancelled') {
                      <div class="admin-comment-section">
                        <label class="detail-label">Motivo de Cancelación del Propietario</label>
                        <div class="admin-comment-content">{{ selectedIncident().adminComment || 'El propietario canceló esta incidencia sin especificar motivo.' }}</div>
                      </div>
                    }
                    
                    <div class="incident-date-footer">
                      <small class="text-muted"><i class="pi pi-calendar me-1" style="color: #f59e0b;"></i>Reportado el {{ selectedIncident().createdAt | date:'dd/MM/yyyy HH:mm' }}</small>
                      @if (selectedIncident().status === 'rejected' && selectedIncident().updatedAt) {
                        <br><small class="text-muted">
                          <i class="pi pi-times me-1" style="color: #dc2626;"></i>
                          Rechazado por administrador el {{ selectedIncident().updatedAt | date:'dd/MM/yyyy HH:mm' }}
                        </small>
                      }
                      @if (selectedIncident().status === 'cancelled' && selectedIncident().updatedAt) {
                        <br><small class="text-muted">
                          <i class="pi pi-ban me-1" style="color: #64748b;"></i>
                          Cancelado por propietario el {{ selectedIncident().updatedAt | date:'dd/MM/yyyy HH:mm' }}
                        </small>
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

    <!-- Modal de Cambio de Estado -->
    @if (showStatusModal()) {
      <div class="modal-backdrop" (click)="showStatusModal.set(false)">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="pi pi-refresh me-2" style="color: #2563EB;"></i>
                Cambiar Estado
              </h5>
            </div>
            <div class="modal-body">
              @if (incidentToUpdate()) {
                <p>Cambiar estado de la incidencia:</p>
                <div class="incident-info-card">
                  <div class="mb-2">{{ incidentToUpdate().title }}</div>
                  <div class="d-flex justify-content-between">
                    <small class="text-muted">{{ incidentToUpdate().ownerName }} | {{ incidentToUpdate().apartment }}</small>
                    <small class="text-muted">{{ incidentToUpdate().createdAt | date:'dd/MM/yyyy' }}</small>
                  </div>
                </div>
                <div class="form-group mt-3">
                  <label for="newStatus">Nuevo Estado</label>
                  <select id="newStatus" [(ngModel)]="newStatus" (change)="onStatusChange()" class="form-control">
                    <option value="">Seleccionar estado...</option>
                    @if (incidentToUpdate().status === 'reported') {
                      <option value="in_progress">En Proceso</option>
                      <option value="resolved">Resuelta</option>
                      <option value="rejected">Rechazada</option>
                    }
                    @if (incidentToUpdate().status === 'in_progress') {
                      <option value="reported">Reportada</option>
                      <option value="resolved">Resuelta</option>
                      <option value="rejected">Rechazada</option>
                    }
                  </select>
                </div>
                @if (newStatus === 'rejected') {
                  <div class="form-group">
                    <label for="adminComment">Motivo de rechazo</label>
                    <textarea id="adminComment" [(ngModel)]="adminComment" class="form-control" rows="3" placeholder="Explica por qué se rechaza esta incidencia..."></textarea>
                    <small class="form-text text-muted">Este comentario será enviado como notificación al propietario</small>
                  </div>
                }
              }
            </div>
            <div class="modal-footer">
              <button 
                type="button" 
                class="btn btn-outline-secondary modal-btn"
                (click)="showStatusModal.set(false)">
                Cancelar
              </button>
              <button 
                type="button" 
                class="btn btn-outline-primary modal-btn"
                (click)="updateIncidentStatus()" 
                [disabled]="!newStatus || updating()">
                {{ updating() ? 'Actualizando...' : 'Actualizar Estado' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .management-layout { height: 100vh; background: #f8fafc; overflow: hidden; }
    .main-content { width: 100%; padding: 0.5rem 1rem 1rem 1rem; max-width: 100vw; box-sizing: border-box; }
    
    .header-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border: 1px solid #e5e7eb;
      overflow: hidden;
    }
    
    .header-content {
      padding: 1.5rem;
    }
    
    .header-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    
    .header-icon {
      width: 3rem;
      height: 3rem;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
    }
    
    .header-text {
      flex: 1;
    }
    
    .header-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 0.25rem 0;
    }
    
    .header-subtitle {
      color: #6b7280;
      margin: 0;
      font-size: 0.875rem;
    }
    
    .filters-section {
      background: #f8fafc;
      border-radius: 8px;
      padding: 1rem;
      border: 1px solid #e5e7eb;
    }
    
    .filter-group {
      display: flex;
      gap: 1rem;
      align-items: end;
    }
    
    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .filter-item.search-item {
      flex: 0 0 33%;
    }
    
    .filter-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .filter-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      font-size: 0.875rem;
      color: #374151;
      min-width: 200px;
      transition: all 0.2s ease;
    }
    
    .filter-select:focus {
      outline: none;
      border-color: #d1d5db;
      box-shadow: none;
    }
    
    .search-input-wrapper {
      position: relative;
    }
    
    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
      font-size: 0.875rem;
    }
    
    .search-input {
      padding: 0.5rem 0.75rem 0.5rem 2.25rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      font-size: 0.875rem;
      color: #374151;
      width: 100%;
      transition: all 0.2s ease;
    }
    
    .search-input:focus {
      outline: none;
      border-color: #d1d5db;
      box-shadow: none;
    }
    
    .search-input::placeholder {
      color: #9ca3af;
    }
    .incidents-card { background: white; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; }
    .card-header { background: #f8f9fa; border-bottom: 1px solid #dee2e6; padding: 1rem; }
    .card-body { padding: 1rem; }
    .table-responsive { overflow-x: auto; max-width: 100%; }
    .table { table-layout: fixed; width: 100%; min-width: 1200px; }
    .table th, .table td { padding: 0.5rem 0.25rem; font-size: 0.875rem; overflow: hidden; text-overflow: ellipsis; }

    .table th:nth-child(1) { width: 8%; }
    .table th:nth-child(2) { width: 18%; }
    .table th:nth-child(3) { width: 24%; white-space: normal; }
    .table th:nth-child(4) { width: 10%; }
    .table th:nth-child(5) { width: 10%; }
    .table th:nth-child(6) { width: 24%; white-space: normal; }
    .table th:nth-child(7) { width: 6%; }
    .table td:nth-child(3) { white-space: normal; word-wrap: break-word; }
    .spinner { width: 2rem; height: 2rem; border: 2px solid #e5e7eb; border-top: 2px solid #2563EB; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem auto; }
    
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

    .priority-badge {
      min-width: 85px !important;
      text-align: center !important;
      display: inline-block !important;
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

    .btn-receipt-compact {
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

    .btn-receipt-compact:hover {
      background: #e5e7eb;
      color: #374151;
    }

    .btn-edit-reported {
      background: transparent;
      color: #f59e0b;
      border: 1px solid #f59e0b;
      width: 2.2rem;
      height: 2.2rem;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-edit-reported:hover {
      background: #f59e0b;
      color: white;
      transform: translateY(-1px);
    }

    .btn-edit-progress {
      background: transparent;
      color: #3b82f6;
      border: 1px solid #3b82f6;
      width: 2.2rem;
      height: 2.2rem;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-edit-progress:hover {
      background: #3b82f6;
      color: white;
      transform: translateY(-1px);
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
      min-width: 80px;
    }

    .edit-btn {
      background: transparent;
      color: #2563EB;
      border: 1px solid #2563EB;
    }

    .edit-btn:hover:not(:disabled) {
      background: #2563EB;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
    }

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
      word-wrap: break-word;
    }

    .modal-lg {
      max-width: 650px;
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

    .btn-close {
      background: transparent;
      border: none;
      color: #6b7280;
      cursor: pointer;
      padding: 0.5rem;
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
    }

    .incident-badges {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-top: 1rem;
    }

    .detail-body {
      padding: 1.5rem;
    }

    .owner-section, .description-section, .image-section, .admin-comment-section {
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

    .detail-label {
      display: block;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.75rem;
      font-size: 0.875rem;
    }

    .owner-info {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      color: #1f2937;
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

    .incident-date-footer {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }

    .incident-info-card {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.25rem;
      margin-top: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.75rem;
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.875rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #d1d5db;
      box-shadow: none;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: none;
    }

    .btn-outline-primary {
      background: white;
      color: #2563EB;
      border: 1px solid #2563EB;
    }

    .btn-outline-primary:hover:not(:disabled) {
      background: #2563EB;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
    }

    .btn-outline-secondary {
      background: white;
      color: #6c757d;
      border: 1px solid #6c757d;
    }

    .btn-outline-secondary:hover {
      background: #6c757d;
      color: white;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

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
      border-color: #f97316;
      color: #f97316;
      background: #fff7ed;
    }

    .pagination-btn.active {
      background: #f97316;
      color: white;
      border-color: #f97316;
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

    .btn-outline-primary:hover:not(:disabled) {
      background: #2563EB;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
    }

    .form-select-sm, .form-control-sm {
      padding: 0.25rem 0.5rem !important;
      font-size: 0.875rem !important;
      line-height: 1.25 !important;
      height: auto !important;
      min-height: 2rem !important;
      margin-top: 0.5rem !important;
    }

    /* Priority Badge Pastel Colors */
    :host ::ng-deep .bg-danger {
      background-color: #fee2e2 !important;
      color: #991b1b !important;
      border: 1px solid #ef4444;
    }

    :host ::ng-deep .bg-warning {
      background-color: #fef3c7 !important;
      color: #92400e !important;
      border: 1px solid #f59e0b;
    }

    :host ::ng-deep .bg-success {
      background-color: #d1fae5 !important;
      color: #065f46 !important;
      border: 1px solid #10b981;
    }

    :host ::ng-deep .bg-primary {
      background-color: #dbeafe !important;
      color: #1e40af !important;
      border: 1px solid #3b82f6;
    }

    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `]
})
export class IncidentManagementComponent implements OnInit {
  loading = signal(false);
  incidents = signal<any[]>([]);
  filteredIncidents = signal<any[]>([]);
  currentPage = signal(1);
  pageSize = 10;
  
  paginatedIncidents = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredIncidents().slice(start, end);
  });
  
  totalPages = computed(() => Math.ceil(this.filteredIncidents().length / this.pageSize));
  
  statusFilter = '';
  priorityFilter = '';
  searchTerm = '';
  
  showDetailModal = signal(false);
  selectedIncident = signal<any>(null);
  
  showStatusModal = signal(false);
  incidentToUpdate = signal<any>(null);
  newStatus = '';
  adminComment = '';
  updating = signal(false);
  
  statusCounts = computed(() => {
    const incidents = this.incidents();
    return {
      reported: incidents.filter(i => i.status === 'reported').length,
      inProgress: incidents.filter(i => i.status === 'in_progress').length,
      resolved: incidents.filter(i => i.status === 'resolved').length,
      rejected: incidents.filter(i => i.status === 'rejected').length,
      cancelled: incidents.filter(i => i.status === 'cancelled').length
    };
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
        this.incidents.set([]);
        this.loading.set(false);
      }
    });
  }

  applyFilters() {
    let filtered = [...this.incidents()];
    
    if (this.statusFilter) {
      filtered = filtered.filter(i => i.status === this.statusFilter);
    }
    
    if (this.priorityFilter) {
      filtered = filtered.filter(i => i.priority === this.priorityFilter);
    }
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(i => 
        i.title.toLowerCase().includes(term) || 
        i.ownerName.toLowerCase().includes(term)
      );
    }
    
    this.filteredIncidents.set(filtered);
    this.currentPage.set(1);
  }

  viewIncidentDetail(incident: any) {
    console.log('Incident data:', incident);
    this.selectedIncident.set(incident);
    this.showDetailModal.set(true);
  }

  openStatusModal(incident: any) {
    this.incidentToUpdate.set(incident);
    this.newStatus = '';
    this.adminComment = '';
    this.showStatusModal.set(true);
  }

  onStatusChange() {
    if (this.newStatus !== 'rejected') {
      this.adminComment = '';
    }
  }

  updateIncidentStatus() {
    const incident = this.incidentToUpdate();
    if (!incident || !this.newStatus) return;
    
    if (this.newStatus === 'rejected' && !this.adminComment.trim()) {
      this.showErrorMessage('Debes agregar un motivo para rechazar la incidencia');
      return;
    }
    
    this.updating.set(true);
    
    const updateData = {
      status: this.newStatus,
      adminComment: this.newStatus === 'rejected' ? this.adminComment : undefined
    };
    
    this.incidentService.updateIncidentStatusWithComment(incident.id, updateData).subscribe({
      next: (response) => {
        if (response.success) {
          const message = this.newStatus === 'rejected' 
            ? 'Incidencia rechazada y notificación enviada al propietario'
            : 'Estado actualizado exitosamente';
          this.showSuccessMessage(message);
          this.loadIncidents();
        }
        this.showStatusModal.set(false);
        this.updating.set(false);
      },
      error: (error) => {
        console.error('Error actualizando estado:', error);
        this.showErrorMessage('Error al actualizar el estado');
        this.showStatusModal.set(false);
        this.updating.set(false);
      }
    });
  }

  viewImage(incident: any) {
    if (incident.id) {
      const token = this.authService.getToken();
      const url = `https://localhost:7009/api/incidents/${incident.id}/image?access_token=${token}`;
      window.open(url, '_blank');
    }
  }

  getCategoryLabel(category: string): string {
    const cat = this.categories.find(c => c.value === category);
    return cat ? cat.label : category;
  }

  getPriorityLabel(priority: string): string {
    const labelMap: { [key: string]: string } = {
      'critical': 'Crítica',
      'high': 'Alta',
      'medium': 'Media',
      'low': 'Baja'
    };
    return labelMap[priority] || priority;
  }

  getPrioritySeverity(priority: string): string {
    const severityMap: { [key: string]: string } = {
      'critical': 'danger',
      'high': 'warning', 
      'medium': 'success',
      'low': 'primary'
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

  Math = Math;
}