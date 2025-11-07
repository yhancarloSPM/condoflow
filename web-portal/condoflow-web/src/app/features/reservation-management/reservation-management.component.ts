import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../core/services/auth.service';
import { ReservationService } from '../../core/services/reservation.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-reservation-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="profile-layout">
      <nav class="top-nav">
        <div class="nav-container">
          <div class="brand" (click)="navigateToHome()" style="cursor: pointer;">
            <div class="brand-icon">
              <i class="pi pi-home"></i>
            </div>
            <span class="brand-name">CondoFlow</span>
          </div>
          <div class="user-section">
            <div class="notification-section dropdown">
              <button 
                class="notification-button dropdown-toggle"
                type="button" 
                id="notificationDropdown"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
                aria-expanded="false">
                <i class="pi pi-bell"></i>
                @if (notificationService.unreadCount() > 0) {
                  <span class="notification-badge">{{ notificationService.unreadCount() }}</span>
                }
              </button>
              
              <div class="dropdown-menu dropdown-menu-end shadow-lg border-0 notification-panel" aria-labelledby="notificationDropdown">
                <div class="card border-0">
                  <div class="card-header bg-white border-bottom">
                    <div class="d-flex justify-content-between align-items-center">
                      <h6 class="mb-0 fw-semibold text-dark">Notificaciones</h6>
                      <button 
                        type="button" 
                        class="btn btn-link p-0 text-danger"
                        (click)="notificationService.clearAll()"
                        title="Limpiar todas">
                        <i class="pi pi-trash"></i>
                      </button>
                    </div>
                  </div>
                  <div class="card-body p-0">
                    @if (notificationService.notifications().length === 0) {
                      <div class="text-center py-4">
                        <i class="pi pi-bell-slash text-muted" style="font-size: 2rem;"></i>
                        <p class="text-muted mb-0 mt-2">No hay notificaciones</p>
                      </div>
                    } @else {
                      <div class="notification-list">
                        @for (notification of notificationService.notifications(); track notification.id) {
                          <div 
                            class="notification-item border-bottom"
                            [class.notification-unread]="!notification.isRead"
                            [class.notification-read]="notification.isRead"
                            (click)="markAsRead(notification.id)"
                          >
                            <div class="d-flex align-items-start p-3">
                              <div class="flex-grow-1">
                                <h6 class="mb-1" [class.fw-bold]="!notification.isRead" [class.fw-normal]="notification.isRead" [class.text-muted]="notification.isRead">{{ notification.title }}</h6>
                                <p class="mb-1 small" [class.text-dark]="!notification.isRead" [class.text-muted]="notification.isRead">{{ notification.message }}</p>
                                <small class="text-muted">{{ notification.createdAt | date:'short' }}</small>
                              </div>
                              @if (!notification.isRead) {
                                <div class="d-flex flex-column align-items-center">
                                  <span class="badge bg-primary rounded-pill mb-1"></span>
                                  <small class="text-primary fw-bold" style="font-size: 0.65rem;">NUEVO</small>
                                </div>
                              } @else {
                                <div class="d-flex flex-column align-items-center">
                                  <span class="badge bg-secondary rounded-pill mb-1"></span>
                                  <small class="text-muted fw-normal" style="font-size: 0.65rem;">LEÍDO</small>
                                </div>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
            <div class="user-info">
              <div class="user-avatar">{{ getUserInitials() }}</div>
              <div class="user-details">
                <span class="user-name">{{ currentUser()?.firstName }} {{ currentUser()?.lastName }}</span>
                <span class="user-role">Administrador</span>
              </div>
            </div>
            <button type="button" class="logout-button" (click)="logout()" title="Cerrar Sesión">
              <i class="pi pi-sign-out"></i>
            </button>
          </div>
        </div>
      </nav>

      <div class="main-content">
        <div class="container-fluid">
          <div class="row mb-3">
            <div class="col-12">
              <div class="header-card">
                <div class="header-content">
                  <div class="header-info">
                    <div class="header-icon">
                      <i class="pi pi-calendar-plus"></i>
                    </div>
                    <div class="header-text">
                      <h2 class="header-title">Gestión de Reservas del Gazebo</h2>
                      <p class="header-subtitle">Administra y supervisa todas las reservas del gazebo</p>
                    </div>
                  </div>
                  
                  <div class="filters-section">
                    <div class="filter-group">
                      <div class="filter-item">
                        <label class="filter-label">Estado</label>
                        <select [(ngModel)]="statusFilter" (change)="applyFilters()" class="filter-select">
                          <option value="">Todos</option>
                          <option value="Pending">Pendientes</option>
                          <option value="Confirmed">Confirmadas</option>
                          <option value="Cancelled">Canceladas</option>
                          <option value="Rejected">Rechazadas</option>
                        </select>
                      </div>
                      
                      <div class="filter-item search-item">
                        <label class="filter-label">Buscar</label>
                        <div class="search-input-wrapper">
                          <i class="pi pi-search search-icon"></i>
                          <input type="text" [(ngModel)]="searchTerm" (input)="applyFilters()" 
                                 class="search-input" placeholder="Propietario o evento...">
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>



          <!-- Reservations Table -->
          <div class="row">
            <div class="col-12">
              <div class="card">
                <div class="card-header bg-white">
                  <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0 text-dark"><i class="pi pi-calendar-plus me-2" style="color: #84cc16;"></i>Todas las Reservas</h5>
                    <div class="d-flex gap-3">
                      <div class="text-center">
                        <div class="badge bg-warning text-dark fw-bold">{{ pendingCount() }}</div>
                        <div><small class="text-muted">Pendientes</small></div>
                      </div>
                      <div class="text-center">
                        <div class="badge bg-success text-white fw-bold">{{ confirmedCount() }}</div>
                        <div><small class="text-muted">Confirmadas</small></div>
                      </div>
                      <div class="text-center">
                        <div class="badge bg-secondary text-white fw-bold">{{ cancelledCount() }}</div>
                        <div><small class="text-muted">Canceladas</small></div>
                      </div>
                      <div class="text-center">
                        <div class="badge bg-danger text-white fw-bold">{{ rejectedCount() }}</div>
                        <div><small class="text-muted">Rechazadas</small></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="card-body d-flex flex-column table-container">
                  @if (loading()) {
                    <div class="text-center py-5 flex-grow-1 d-flex flex-column justify-content-center">
                      <div class="spinner-border text-primary" role="status"></div>
                      <p class="text-muted mt-2">Cargando reservas...</p>
                    </div>
                  } @else if (paginatedReservations().length === 0) {
                    <div class="text-center py-5 flex-grow-1 d-flex flex-column justify-content-center">
                      <i class="pi pi-calendar" style="font-size: 4rem; color: #6c757d;"></i>
                      <h6 class="text-muted mt-3">No hay reservas registradas</h6>
                      <p class="text-muted small">Las reservas aparecerán aquí cuando los propietarios las creen</p>
                    </div>
                  } @else {
                    <div class="table-responsive" style="flex: 1; overflow-y: auto; min-height: 0;">
                      <table class="table table-striped">
                        <thead>
                          <tr>
                            <th style="width: 11%;">Propietario</th>
                            <th style="width: 9%;">Fecha</th>
                            <th style="width: 11%;">Horario</th>
                            <th style="width: 22%;">Tipo de Evento</th>
                            <th style="width: 9%;">Estado</th>
                            <th style="width: 23%;">Comentario</th>
                            <th style="width: 15%; text-align: right; padding-right: 1.5rem;">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (reservation of paginatedReservations(); track reservation.id) {
                            <tr>
                              <td>{{ reservation.userName }}</td>
                              <td>{{ reservation.reservationDate | date:'dd/MM/yyyy' }}</td>
                              <td>{{ formatTime(reservation.startTime) }} - {{ formatTime(reservation.endTime) }}</td>
                              <td>{{ getEventType(reservation.notes) }}</td>
                              <td>
                                <span 
                                  class="badge status-badge"
                                  [class]="'bg-' + getStatusSeverity(reservation.status)">
                                  {{ getStatusText(reservation.status) }}
                                </span>
                              </td>
                              <td>
                                @if (reservation.status === 'Rejected' && reservation.rejectionReason) {
                                  {{ reservation.rejectionReason }}
                                } @else if (reservation.status === 'Cancelled') {
                                  Anulada por propietario →
                                } @else {
                                  <span class="text-muted">—</span>
                                }
                              </td>
                              <td style="padding-right: 1.5rem;">
                                <div class="d-flex gap-1 justify-content-end">
                                  @if (reservation.status === 'Pending') {
                                    <button 
                                      class="btn-action-compact approve"
                                      (click)="showApprovalModal(reservation)"
                                      title="Confirmar">
                                      <i class="pi pi-check"></i>
                                    </button>
                                    <button 
                                      class="btn-action-compact reject"
                                      (click)="showRejectionModal(reservation)"
                                      title="Rechazar">
                                      <i class="pi pi-times"></i>
                                    </button>
                                  } @else if (reservation.status === 'Confirmed') {
                                    <button 
                                      class="btn-action-compact reject"
                                      (click)="showRejectionModal(reservation)"
                                      title="Rechazar">
                                      <i class="pi pi-times"></i>
                                    </button>
                                  } @else if (reservation.status === 'Rejected') {
                                    <button 
                                      class="btn-action-compact approve"
                                      (click)="showApprovalModal(reservation)"
                                      title="Confirmar">
                                      <i class="pi pi-check"></i>
                                    </button>
                                  } @else if (reservation.status === 'Cancelled' && reservation.cancellationReason) {
                                    <button 
                                      class="btn-action-compact detail"
                                      (click)="viewCancellationReason(reservation)"
                                      title="Ver detalles">
                                      <i class="pi pi-eye"></i>
                                    </button>
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
                            Mostrando {{ (currentPage() - 1) * pageSize + 1 }} - {{ Math.min(currentPage() * pageSize, filteredReservations().length) }} de {{ filteredReservations().length }} reservas
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
    <p-toast></p-toast>



    <!-- Modal de Aprobación -->
    @if (showApprovalModalVisible()) {
      <div class="modal-backdrop" (click)="closeApprovalModal()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="pi pi-check-circle me-2" style="color: #10b981;"></i>
                Confirmar Reserva
              </h5>
            </div>
            <div class="modal-body">
              <p>¿Confirmas que deseas confirmar esta reserva?</p>
              @if (selectedReservation()) {
                <div class="reservation-info-card">
                  <div class="d-flex align-items-center justify-content-between">
                    <div>
                      <div>{{ getEventType(selectedReservation().notes) }}</div>
                      <small class="text-muted">{{ selectedReservation().userName }}</small>
                    </div>
                    <div class="text-end">
                      <div class="text-success">{{ selectedReservation().reservationDate | date:'dd/MM/yyyy' }}</div>
                      <small class="text-muted">{{ formatTime(selectedReservation().startTime) }} - {{ formatTime(selectedReservation().endTime) }}</small>
                    </div>
                  </div>
                </div>
              }
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary modal-btn" (click)="closeApprovalModal()">
                Cancelar
              </button>
              <button type="button" class="btn btn-outline-success modal-btn" (click)="confirmApproval()">
                Sí, confirmar
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Modal de Rechazo -->
    @if (showRejectModal()) {
      <div class="modal-backdrop" (click)="closeRejectModal()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="pi pi-exclamation-triangle me-2" style="color: #ef4444;"></i>
                Rechazar Reserva
              </h5>
            </div>
            <div class="modal-body">
              <p>¿Estás seguro de que deseas rechazar esta reserva?</p>
              @if (selectedReservation()) {
                <div class="reservation-info-card">
                  <div class="d-flex align-items-center justify-content-between">
                    <div>
                      <div>{{ getEventType(selectedReservation().notes) }}</div>
                      <small class="text-muted">{{ selectedReservation().userName }}</small>
                    </div>
                    <div class="text-end">
                      <div class="text-danger">{{ selectedReservation().reservationDate | date:'dd/MM/yyyy' }}</div>
                      <small class="text-muted">{{ formatTime(selectedReservation().startTime) }} - {{ formatTime(selectedReservation().endTime) }}</small>
                    </div>
                  </div>
                </div>
              }
              <div class="form-group" style="margin-top: 1rem;">
                <label for="rejectionReason">Motivo del rechazo *</label>
                <textarea 
                  id="rejectionReason"
                  [(ngModel)]="rejectionReason"
                  class="form-control"
                  rows="3"
                  placeholder="Explica por qué se rechaza esta reserva..."
                  required>
                </textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary modal-btn" (click)="closeRejectModal()">
                Cancelar
              </button>
              <button 
                type="button" 
                class="btn btn-outline-danger modal-btn" 
                (click)="confirmRejectReservation()"
                [disabled]="!rejectionReason().trim() || rejectionReason().trim().length < 10">
                Sí, rechazar
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Modal de Motivo de Cancelación -->
    @if (showCancellationModal()) {
      <div class="modal-backdrop" (click)="closeCancellationModal()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="pi pi-ban me-2" style="color: #6c757d;"></i>
                Motivo de Cancelación
              </h5>
            </div>
            <div class="modal-body">
              <p><strong>Reserva:</strong> {{ selectedCancellation()?.reservationDate | date:'dd/MM/yyyy' }}</p>
              <p><strong>Propietario:</strong> {{ selectedCancellation()?.userName }}</p>
              <p><strong>Tipo de Evento:</strong> {{ getEventType(selectedCancellation()?.notes) }}</p>
              <div class="mt-3">
                <label class="form-label fw-bold">Motivo de la cancelación:</label>
                <div class="p-3 bg-light rounded border">
                  {{ selectedCancellation()?.cancellationReason }}
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary modal-btn" (click)="closeCancellationModal()">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .profile-layout { min-height: 100vh; background: #f8fafc; display: flex; flex-direction: column; }
    .top-nav { background: white; border-bottom: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); }
    .nav-container { width: 100%; padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; height: 4rem; }
    .brand { display: flex; align-items: center; gap: 0.75rem; }
    .brand-icon { width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 1.5rem; }
    .brand-name { font-size: 1.5rem; font-weight: 700; color: #1f2937; }
    .user-section { display: flex; align-items: center; gap: 1.5rem; padding: 0.5rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e5e7eb; }
    .notification-section { position: relative; padding: 0.25rem; }
    .notification-button { background: transparent; border: 1px solid #e5e7eb; color: #6b7280; width: 2.25rem; height: 2.25rem; border-radius: 6px; padding: 0; position: relative; cursor: pointer; }
    .notification-button:hover { border-color: #2563EB; color: #2563EB; background: #eff6ff; }
    .notification-badge { position: absolute; top: -8px; right: -8px; background: #dc3545; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; display: flex; align-items: center; justify-content: center; }
    .notification-panel { width: 350px; max-height: 450px; border-radius: 12px !important; }
    .notification-list { max-height: 350px; overflow-y: auto; }
    .notification-item { cursor: pointer; transition: all 0.2s ease; }
    .notification-item:hover { background: #f8f9fa !important; }
    .notification-item:last-child { border-bottom: none !important; }
    .notification-unread { background: linear-gradient(90deg, #eff6ff 0%, #f0f9ff 100%) !important; border-left: 3px solid #2563EB !important; }
    .notification-read { background: #fafafa !important; opacity: 0.8; }
    .notification-read:hover { opacity: 1 !important; }
    .user-info { display: flex; align-items: center; gap: 0.75rem; padding: 0.25rem 0.75rem; border-radius: 8px; transition: background 0.2s ease; }
    .user-info:hover { background: rgba(255, 255, 255, 0.5); }
    .user-avatar { background: linear-gradient(135deg, #10B981, #059669); color: white; font-weight: 600; width: 2.25rem; height: 2.25rem; font-size: 0.875rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .user-details { display: flex; flex-direction: column; align-items: flex-start; }
    .user-name { font-weight: 600; color: #1f2937; font-size: 0.875rem; line-height: 1.2; }
    .user-role { font-size: 0.75rem; color: #6b7280; line-height: 1.2; }
    .logout-button { background: white; border: 1px solid #e5e7eb; color: #6b7280; width: 2.5rem; height: 2.5rem; border-radius: 8px; padding: 0; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
    .logout-button:hover { border-color: #fca5a5; color: #ef4444; background: #fef2f2; }
    .main-content { width: 100%; padding: 1rem 2rem; }
    .card { border: none; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .card-header { background: #f8f9fa; border-bottom: 1px solid #dee2e6; }
    .table th, .table td { font-size: 0.875rem; }
    
    .stat-card { background: white; border-radius: 8px; padding: 1rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.75rem; transition: all 0.2s ease; }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
    .stat-icon { width: 2.5rem; height: 2.5rem; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 1rem; color: white; }
    .stat-card.pending .stat-icon { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .stat-card.confirmed .stat-icon { background: linear-gradient(135deg, #10B981, #059669); }

    .stat-card.rejected .stat-icon { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .stat-card.cancelled .stat-icon { background: linear-gradient(135deg, #6b7280, #4b5563); }
    .stat-info h3 { font-size: 1.25rem; font-weight: 700; color: #1f2937; margin: 0; }
    .stat-info p { color: #6b7280; margin: 0; font-size: 0.8rem; }
    .row-processed { background-color: #f8f9fa !important; opacity: 0.7; }
    .row-processed td { color: #6c757d !important; }
    .row-pending { background-color: #fff3cd; }
    .row-confirmed { background-color: #d1ecf1; }
    .row-rejected { background-color: #f8d7da; }

    
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1050; }
    .modal-dialog { max-width: 500px; width: 90%; }
    .modal-content { background: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
    .modal-header { padding: 1rem 1.5rem; border-bottom: 1px solid #dee2e6; }
    .modal-title { margin: 0; font-weight: 600; }
    .modal-body { padding: 1.5rem; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #dee2e6; display: flex; gap: 0.5rem; justify-content: flex-end; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .form-control { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.875rem; transition: border-color 0.2s ease, box-shadow 0.2s ease; }
    .form-control:focus { outline: none; border-color: #d1d5db; box-shadow: none; }
    .form-group label { display: block; margin-bottom: 0.75rem; font-weight: 600; color: #374151; font-size: 0.875rem; }
    .text-info { color: #0dcaf0; }
    .text-secondary { color: #6b7280; }
    .text-warning { color: #f59e0b; }
    .text-danger { color: #dc3545; }
    .mt-3 { margin-top: 1rem; }
    .fw-bold { font-weight: 600; }
    .bg-light { background-color: #f8f9fa; }
    .rounded { border-radius: 0.375rem; }
    .border { border: 1px solid #dee2e6; }
    .p-3 { padding: 1rem; }
    .me-2 { margin-right: 0.5rem; }
    .ms-2 { margin-left: 0.5rem; }

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

    .approve-btn {
      background: transparent;
      color: #10b981;
      border: 1px solid #10b981;
    }

    .approve-btn:hover:not(:disabled) {
      background: #10b981;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
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

    .detail-btn {
      background: transparent;
      color: #6c757d;
      border: 1px solid #6c757d;
    }

    .detail-btn:hover:not(:disabled) {
      background: #6c757d;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(108, 117, 125, 0.2);
    }

    /* Subtle Status Badges */
    :host ::ng-deep .badge {
      font-weight: 400 !important;
      font-size: 0.75rem !important;
      padding: 0.35rem 0.65rem !important;
      border-radius: 0.5rem !important;
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

    :host ::ng-deep .bg-info {
      background-color: #dbeafe !important;
      color: #1e40af !important;
      border: 1px solid #3b82f6;
    }

    .reservation-info-card {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.25rem;
      margin-top: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    /* Modal Buttons */
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

    .btn-outline-success {
      border-color: #10b981;
      color: #10b981;
    }

    .btn-outline-success:hover:not(:disabled) {
      background: #10b981;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
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
      border-color: #84cc16;
      color: #84cc16;
      background: #f7fee7;
    }

    .pagination-btn.active {
      background: #84cc16;
      color: white;
      border-color: #84cc16;
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

    .status-badge {
      min-width: 85px !important;
      text-align: center !important;
      display: inline-block !important;
    }

    .btn-action-compact {
      width: 2.2rem;
      height: 2.2rem;
      border-radius: 6px;
      border: 1px solid;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.875rem;
    }

    .btn-action-compact.approve {
      border-color: #10b981;
      color: #10b981;
    }

    .btn-action-compact.approve:hover {
      background: #10b981;
      color: white;
      transform: translateY(-1px);
    }

    .btn-action-compact.reject {
      border-color: #ef4444;
      color: #ef4444;
    }

    .btn-action-compact.reject:hover {
      background: #ef4444;
      color: white;
      transform: translateY(-1px);
    }

    .btn-action-compact.detail {
      border-color: #6b7280;
      color: #6b7280;
    }

    .btn-action-compact.detail:hover {
      background: #6b7280;
      color: white;
      transform: translateY(-1px);
    }

    .table-container {
      height: calc(100vh - 420px);
    }

    @media (max-width: 1200px) {
      .table-container {
        height: calc(100vh - 380px);
      }
    }

    @media (max-width: 768px) {
      .table-container {
        height: calc(100vh - 340px);
      }
    }

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
      background: linear-gradient(135deg, #84cc16, #65a30d);
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

  `]
})
export class ReservationManagementComponent implements OnInit, OnDestroy {
  currentUser = signal<any>(null);
  loading = signal(false);
  reservations = signal<any[]>([]);
  
  pendingCount = signal(0);
  confirmedCount = signal(0);
  rejectedCount = signal(0);
  cancelledCount = signal(0);
  
  showRejectModal = signal(false);
  showApprovalModalVisible = signal(false);
  selectedReservation = signal<any>(null);
  selectedReservationId = signal('');
  rejectionReason = signal('');
  

  
  showCancellationModal = signal(false);
  selectedCancellation = signal<any>(null);
  
  currentPage = signal(1);
  pageSize = 10;
  
  filteredReservations = signal<any[]>([]);
  statusFilter = '';
  searchTerm = '';
  
  paginatedReservations = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredReservations().slice(start, end);
  });
  
  totalPages = computed(() => Math.ceil(this.filteredReservations().length / this.pageSize));

  constructor(
    private router: Router,
    private authService: AuthService,
    private reservationService: ReservationService,
    private messageService: MessageService,
    public notificationService: NotificationService
  ) {}

  async ngOnInit() {
    this.currentUser.set(this.authService.user());
    this.loadAllReservations();
    await this.notificationService.startConnection();
  }

  loadAllReservations() {
    this.loading.set(true);
    this.reservationService.getAllReservations().subscribe({
      next: (response) => {
        this.reservations.set(response.data || []);
        this.applyFilters();
        this.updateCounts();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading reservations:', error);
        this.reservations.set([]);
        this.applyFilters();
        this.updateCounts();
        this.loading.set(false);
      }
    });
  }

  applyFilters() {
    let filtered = [...this.reservations()];
    
    if (this.statusFilter) {
      filtered = filtered.filter(r => r.status === this.statusFilter);
    }
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.userName.toLowerCase().includes(term) || 
        this.getEventType(r.notes).toLowerCase().includes(term)
      );
    }
    
    // Ordenar por fecha de creación
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    this.filteredReservations.set(filtered);
    this.currentPage.set(1);
  }

  updateCounts() {
    const reservations = this.reservations();
    
    this.pendingCount.set(reservations.filter(r => r.status === 'Pending').length);
    this.confirmedCount.set(reservations.filter(r => r.status === 'Confirmed').length);
    this.rejectedCount.set(reservations.filter(r => r.status === 'Rejected').length);
    this.cancelledCount.set(reservations.filter(r => r.status === 'Cancelled').length);
  }

  showApprovalModal(reservation: any) {
    this.selectedReservation.set(reservation);
    this.showApprovalModalVisible.set(true);
  }

  showRejectionModal(reservation: any) {
    this.selectedReservation.set(reservation);
    this.selectedReservationId.set(reservation.id);
    this.rejectionReason.set('');
    this.showRejectModal.set(true);
  }

  confirmApproval() {
    const reservation = this.selectedReservation();
    if (!reservation) return;
    
    this.reservationService.updateReservationStatus(reservation.id, 'Confirmed').subscribe({
      next: () => {
        this.closeApprovalModal();
        this.messageService.add({
          severity: 'success',
          summary: 'Reserva Confirmada',
          detail: 'La reserva ha sido confirmada exitosamente'
        });
        this.loadAllReservations();
      },
      error: (error) => {
        console.error('Error approving reservation:', error);
        this.closeApprovalModal();
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al aprobar la reserva'
        });
      }
    });
  }

  closeApprovalModal() {
    this.showApprovalModalVisible.set(false);
    this.selectedReservation.set(null);
  }

  closeRejectModal() {
    this.showRejectModal.set(false);
    this.selectedReservation.set(null);
    this.selectedReservationId.set('');
    this.rejectionReason.set('');
  }

  confirmRejectReservation() {
    const id = this.selectedReservationId();
    const reason = this.rejectionReason().trim();
    
    if (!reason || reason.length < 10) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'El motivo debe tener al menos 10 caracteres'
      });
      return;
    }
    
    this.reservationService.updateReservationStatus(id, 'Rejected', reason).subscribe({
      next: () => {
        this.closeRejectModal();
        this.messageService.add({
          severity: 'success',
          summary: 'Reserva Rechazada',
          detail: 'La reserva ha sido rechazada exitosamente'
        });
        this.loadAllReservations();
      },
      error: (error) => {
        console.error('Error rejecting reservation:', error);
        this.closeRejectModal();
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Error al rechazar la reserva'
        });
      }
    });
  }

  viewDetails(reservation: any) {
    // TODO: Mostrar modal con detalles completos
    console.log('Ver detalles:', reservation);
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  getEventType(notes: string): string {
    if (!notes) return 'No especificado';
    const match = notes.match(/Tipo: ([^\n]+)/);
    return match ? match[1] : 'No especificado';
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Pending': 'Pendiente',
      'Confirmed': 'Confirmada',
      'Cancelled': 'Cancelada',
      'Completed': 'Completada',
      'Rejected': 'Rechazada'
    };
    return statusMap[status] || status;
  }

  getStatusSeverity(status: string): string {
    const severityMap: { [key: string]: string } = {
      'Pending': 'warning',
      'Confirmed': 'success',
      'Cancelled': 'secondary',
      'Completed': 'info',
      'Rejected': 'danger'
    };
    return severityMap[status] || 'secondary';
  }

  navigateToHome(): void {
    this.router.navigate(['/welcome']);
  }

  logout(): void {
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

  getRowClass(status: string): string {
    switch (status) {
      case 'Pending': return 'row-pending';
      case 'Confirmed': return 'row-confirmed';
      case 'Rejected': return 'row-rejected';
      case 'Cancelled': return 'row-cancelled';
      default: return 'row-processed';
    }
  }

  viewCancellationReason(reservation: any) {
    this.selectedCancellation.set(reservation);
    this.showCancellationModal.set(true);
  }

  closeCancellationModal() {
    this.showCancellationModal.set(false);
    this.selectedCancellation.set(null);
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

  async markAsRead(notificationId: string): Promise<void> {
    await this.notificationService.markAsRead(notificationId);
  }

  async ngOnDestroy() {
    await this.notificationService.stopConnection();
  }
}