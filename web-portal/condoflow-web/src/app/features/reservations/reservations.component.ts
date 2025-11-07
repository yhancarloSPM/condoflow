import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ReservationService } from '../../core/services/reservation.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-layout">
      <!-- Top Navigation -->
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
              <div class="user-avatar">
                {{ getUserInitials() }}
              </div>
              <div class="user-details">
                <span class="user-name">{{ currentUser()?.firstName }} {{ currentUser()?.lastName }}</span>
                <span class="user-role">{{ isOwner() ? 'Propietario' : 'Administrador' }}</span>
              </div>
            </div>
            <button 
              type="button" 
              class="logout-button"
              (click)="logout()"
              title="Cerrar Sesión">
              <i class="pi pi-sign-out"></i>
            </button>
          </div>
        </div>
      </nav>

      <div class="main-content">
        <div class="container-fluid">
      <div class="row mb-3">
        <div class="col-12">
          <div class="d-flex align-items-start bg-light p-3 rounded shadow-sm">
            <div class="me-3 d-flex align-items-center" style="height: 3rem;">
              <i class="pi pi-home" style="font-size: 2rem; color: #2563EB;"></i>
            </div>
            <div class="flex-grow-1">
              <h2 class="mb-1 fw-bold">Reservas del Gazebo</h2>
              <p class="text-muted mb-0">Reserva el área común para tus eventos especiales</p>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-lg-4 col-md-12 mb-3">
          <div class="card">
            <div class="card-header bg-white">
              <h5 class="mb-0 text-dark"><i class="pi pi-calendar me-2"></i>Reserva del Gazebo</h5>
            </div>
            <div class="card-body">
              <form (ngSubmit)="createReservation()">
                <div class="mb-3">
                  <label class="form-label fw-bold">Tipo de Evento</label>
                  <select 
                    [(ngModel)]="selectedEventType" 
                    name="eventType"
                    class="form-select form-select-lg">
                    <option value="">¿Qué vas a celebrar?</option>
                    @for (eventType of eventTypes; track eventType.value) {
                      <option [value]="eventType.value">{{ eventType.label }}</option>
                    }
                  </select>
                </div>
                
                <div class="mb-3">
                  <label class="form-label fw-bold">Fecha de la Reserva</label>
                  <input 
                    type="date" 
                    [(ngModel)]="selectedDateStr" 
                    name="date"
                    [min]="minDateStr"
                    class="form-control form-control-lg">
                </div>
                
                <div class="mb-3">
                  <label class="form-label fw-bold">Horario del Evento</label>
                  <div class="row g-2">
                    <div class="col-6">
                      <label class="form-label text-muted small">Hora de Inicio</label>
                      <input 
                        type="time" 
                        [(ngModel)]="startTime" 
                        name="startTime"
                        class="form-control">
                    </div>
                    <div class="col-6">
                      <label class="form-label text-muted small">Hora de Fin</label>
                      <input 
                        type="time" 
                        [(ngModel)]="endTime" 
                        name="endTime"
                        class="form-control">
                    </div>
                  </div>
                </div>
                
                <div class="mb-4">
                  <label class="form-label fw-bold">Descripción del Evento</label>
                  <textarea 
                    [(ngModel)]="notes" 
                    name="notes"
                    class="form-control" 
                    rows="3" 
                    placeholder="Describe tu evento...">
                  </textarea>
                </div>
                
                <button 
                  type="submit" 
                  class="btn btn-primary btn-lg w-100"
                  [disabled]="!selectedDateStr || !startTime || !endTime || !selectedEventType || loading()">
                  <i class="pi pi-check me-2"></i>
                  {{ loading() ? 'Creando Reserva...' : 'Reservar Gazebo' }}
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <div class="col-lg-8 col-md-12">
          <div class="card h-100">
            <div class="card-header bg-white">
              <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
                <h5 class="mb-0 text-dark"><i class="pi pi-list me-2"></i>Mis Reservas del Gazebo</h5>
                <div class="d-flex flex-wrap gap-2">
                  <div class="text-center">
                    <div class="badge bg-warning text-dark fw-bold">{{ statusCounts().pending }}</div>
                    <div><small class="text-muted">Pendientes</small></div>
                  </div>
                  <div class="text-center">
                    <div class="badge bg-success text-white fw-bold">{{ statusCounts().confirmed }}</div>
                    <div><small class="text-muted">Aprobadas</small></div>
                  </div>
                  <div class="text-center">
                    <div class="badge bg-secondary text-white fw-bold">{{ statusCounts().cancelled }}</div>
                    <div><small class="text-muted">Canceladas</small></div>
                  </div>
                  <div class="text-center">
                    <div class="badge bg-danger text-white fw-bold">{{ statusCounts().rejected }}</div>
                    <div><small class="text-muted">Rechazadas</small></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-body d-flex flex-column">
              @if (reservations().length === 0) {
                <div class="text-center py-5 flex-grow-1 d-flex flex-column justify-content-center">
                  <i class="pi pi-calendar" style="font-size: 4rem; color: #6c757d;"></i>
                  <h6 class="text-muted mt-3">No tienes reservas del gazebo</h6>
                  <p class="text-muted small">Crea tu primera reserva para usar el área común</p>
                </div>
              } @else {
                <div class="table-responsive flex-grow-1" style="overflow-y: auto;">
                  <table class="table table-striped">
                    <thead class="sticky-top bg-white">
                      <tr>
                        <th>Fecha</th>
                        <th>Horario</th>
                        <th>Tipo de Evento</th>
                        <th>Descripción</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (reservation of paginatedReservations(); track reservation.id) {
                        <tr>
                          <td>
                            <div>{{ reservation.reservationDate | date:'dd/MM/yyyy' }}</div>
                          </td>
                          <td>
                            <div>{{ formatTime(reservation.startTime) }} - {{ formatTime(reservation.endTime) }}</div>
                          </td>
                          <td>
                            <div>{{ getEventType(reservation.notes) }}</div>
                          </td>
                          <td>
                            <div><small>{{ getEventDescription(reservation.notes) || 'Sin descripción' }}</small></div>
                          </td>
                          <td>
                            <div>
                              <span 
                                class="badge"
                                [class]="'bg-' + getStatusSeverity(reservation.status)">
                                {{ getStatusText(reservation.status) }}
                              </span>
                            </div>
                          </td>
                          <td class="text-center">
                            @if (reservation.status === 'Pending' || reservation.status === 'Confirmed') {
                              <button 
                                class="btn-action-compact reject"
                                (click)="openCancelModal(reservation.id)"
                                title="Cancelar reserva">
                                <i class="pi pi-times"></i>
                              </button>
                            } @else if (reservation.status === 'Cancelled') {
                              <div class="status-icon-simple cancelled" title="Reserva cancelada">
                                <i class="pi pi-ban"></i>
                              </div>
                            } @else if (reservation.status === 'Rejected') {
                              <div class="status-icon-simple rejected" title="Reserva rechazada">
                                <i class="pi pi-times-circle"></i>
                              </div>
                            } @else {
                              <div class="status-icon-simple completed" title="Reserva completada">
                                <i class="pi pi-check-circle"></i>
                              </div>
                            }
                          </td>
                        </tr>
                        @if (reservation.status === 'Rejected' && reservation.rejectionReason) {
                          <tr>
                            <td colspan="6" class="p-2 bg-light border-top-0">
                              <small class="text-danger">
                                <i class="pi pi-exclamation-triangle me-1"></i>
                                <strong>Motivo del rechazo:</strong> {{ reservation.rejectionReason }}
                              </small>
                            </td>
                          </tr>
                        }
                      }
                    </tbody>
                  </table>
                </div>
                
                <!-- Paginación -->
                @if (totalPages() > 1) {
                  <div class="d-flex justify-content-between align-items-center pt-3 border-top" style="margin-top: 5px;">
                    <div>
                      <small class="text-muted">
                        Mostrando {{ (currentPage() - 1) * pageSize + 1 }} - {{ Math.min(currentPage() * pageSize, reservations().length) }} de {{ reservations().length }} reservas
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

    <!-- Modal de Cancelación -->
    @if (showCancelModal()) {
      <div class="modal-backdrop" (click)="showCancelModal.set(false)">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="pi pi-exclamation-triangle text-warning me-2"></i>
                Cancelar Reserva
              </h5>
            </div>
            <div class="modal-body">
              <p>¿Estás seguro de que deseas cancelar esta reserva?</p>
              @if (reservationToCancel()) {
                <div class="reservation-info-card">
                  <div class="d-flex align-items-center justify-content-between">
                    <div>
                      <div class="fw-semibold">{{ getEventType(reservationToCancel().notes) }}</div>
                      <small class="text-muted">{{ reservationToCancel().reservationDate | date:'dd/MM/yyyy' }}</small>
                    </div>
                    <div class="text-end">
                      <div class="fw-bold text-dark">{{ formatTime(reservationToCancel().startTime) }} - {{ formatTime(reservationToCancel().endTime) }}</div>
                      <small class="text-muted">{{ getStatusText(reservationToCancel().status) }}</small>
                    </div>
                  </div>
                </div>
              }
              <p class="text-muted small mt-3">Esta acción no se puede deshacer.</p>
              <div class="form-group">
                <label for="cancellationReason">Motivo de la cancelación *</label>
                <textarea 
                  id="cancellationReason"
                  [(ngModel)]="cancellationReason"
                  class="form-control"
                  rows="3"
                  placeholder="Explica por qué cancelas esta reserva..."

                  required>
                </textarea>
              </div>
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
                (click)="cancelReservation()"
                [disabled]="!cancellationReason().trim() || cancellationReason().trim().length < 10">
                Sí, cancelar
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
    .brand-icon { width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #2563EB, #1d4ed8); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.25rem; }
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
    .user-details { display: flex; flex-direction: column; }
    .user-name { font-weight: 600; color: #1f2937; font-size: 0.875rem; }
    .user-role { font-size: 0.75rem; color: #6b7280; }
    .logout-button { background: white; border: 1px solid #e5e7eb; color: #6b7280; width: 2.5rem; height: 2.5rem; border-radius: 8px; padding: 0; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
    .logout-button:hover { border-color: #fca5a5; color: #ef4444; background: #fef2f2; }
    .main-content { width: 100%; padding: 1rem; }
    .card { border: none; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .table-responsive { overflow-x: auto; }
    .table th, .table td { white-space: nowrap; padding: 0.5rem 0.25rem; font-size: 0.875rem; }
    .table th:nth-child(4), .table td:nth-child(4) { max-width: 200px; white-space: normal; word-wrap: break-word; }
    .card-header { background: #f8f9fa; border-bottom: 1px solid #dee2e6; }
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1050; }
    .modal-dialog { max-width: 400px; width: 90%; }
    .modal-content { background: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
    .modal-header { padding: 1rem 1.5rem; border-bottom: 1px solid #dee2e6; }
    .modal-title { margin: 0; font-weight: 600; }
    .modal-body { padding: 1.5rem; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #dee2e6; display: flex; gap: 0.5rem; justify-content: flex-end; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .form-control { width: 100%; padding: 0.5rem; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.875rem; }
    
    .reservation-info-card {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      padding: 1rem;
      margin-top: 1rem;
    }

    .btn-action-compact {
      width: 2.2rem;
      height: 2.2rem;
      border-radius: 6px;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.875rem;
    }

    .btn-action-compact.reject {
      background: #fee2e2;
      color: #991b1b;
    }

    .btn-action-compact.reject:hover:not(:disabled) {
      background: #ef4444;
      color: white;
      transform: translateY(-1px);
    }

    .btn-action-compact:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .status-icon-simple {
      width: 2.2rem;
      height: 2.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }

    .status-icon-simple.cancelled {
      color: #6b7280;
    }

    .status-icon-simple.rejected {
      color: #ef4444;
    }

    .status-icon-simple.completed {
      color: #10b981;
    }

    /* Status Icons */
    .status-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.375rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      cursor: help;
      font-weight: 400;
      min-width: 100px;
      border: 1px solid transparent;
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

    .status-icon.cancelled {
      background: #f3f4f6;
      color: #6b7280;
    }

    .status-icon.rejected {
      background: #fef2f2;
      color: #ef4444;
    }

    .status-icon.completed {
      background: #f0fdf4;
      color: #10b981;
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

    .cursor-pointer {
      cursor: pointer;
    }

    .cursor-pointer:hover {
      opacity: 0.7;
      transform: scale(1.1);
      transition: all 0.2s ease;
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

    /* Laptop Styles (1024px - 1366px) */
    @media (max-width: 1366px) and (min-width: 1024px) {
      .table-responsive {
        max-height: 400px !important;
        overflow-y: auto !important;
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
      
      .pagination-btn {
        padding: 0.4rem 0.6rem;
        font-size: 0.8rem;
        min-width: 2rem;
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
      
      .pagination-btn {
        padding: 0.3rem 0.5rem;
        font-size: 0.75rem;
        min-width: 1.8rem;
      }
    }
  `]
})
export class ReservationsComponent implements OnInit {
  selectedDateStr: string = '';
  startTime: string = '';
  endTime: string = '';
  selectedEventType: string = '';
  notes: string = '';
  minDateStr = new Date().toISOString().split('T')[0];
  loading = signal(false);
  reservations = signal<any[]>([]);
  currentPage = signal(1);
  pageSize = 8;
  
  paginatedReservations = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.reservations().slice(start, end);
  });
  
  totalPages = computed(() => Math.ceil(this.reservations().length / this.pageSize));
  currentUser = signal<any>(null);
  
  statusCounts = computed(() => {
    const reservations = this.reservations();
    return {
      pending: reservations.filter(r => r.status === 'Pending').length,
      confirmed: reservations.filter(r => r.status === 'Confirmed').length,
      cancelled: reservations.filter(r => r.status === 'Cancelled').length,
      rejected: reservations.filter(r => r.status === 'Rejected').length
    };
  });
  
  eventTypes = [
    { label: 'Cumpleaños', value: 'cumpleanos' },
    { label: 'Bautismo', value: 'bautismo' },
    { label: 'Baby Shower', value: 'baby_shower' },
    { label: 'Culto de la Iglesia', value: 'culto_iglesia' },
    { label: 'Reunión Familiar', value: 'reunion_familiar' },
    { label: 'Celebración', value: 'celebracion' },
    { label: 'Evento Social', value: 'evento_social' },
    { label: 'Otro', value: 'otro' }
  ];

  constructor(
    private reservationService: ReservationService,
    private router: Router,
    private authService: AuthService,
    public notificationService: NotificationService
  ) {}

  async ngOnInit() {
    this.currentUser.set(this.authService.user());
    this.loadReservations();
    await this.notificationService.startConnection();
  }

  loadReservations() {
    this.reservationService.getMyReservations().subscribe({
      next: (response) => {
        if (response.success) {
          const sorted = (response.data || []).sort((a: any, b: any) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          this.reservations.set(sorted);
        }
      },
      error: (error) => {
        console.error('Error cargando reservas:', error);
        this.reservations.set([]);
      }
    });
  }

  createReservation() {
    if (!this.selectedDateStr || !this.startTime || !this.endTime || !this.selectedEventType) return;
    

    
    this.loading.set(true);
    
    const eventTypeLabel = this.eventTypes.find(e => e.value === this.selectedEventType)?.label || '';
    const fullNotes = `Tipo: ${eventTypeLabel}${this.notes ? '\n' + this.notes : ''}`;
    
    // Validar que no sean la misma hora
    if (this.startTime === this.endTime) {
      this.showErrorMessage('La hora de inicio debe ser diferente a la hora de fin');
      this.loading.set(false);
      return;
    }
    
    const reservation = {
      reservationDate: this.selectedDateStr,
      startTime: this.startTime + ':00',
      endTime: this.endTime + ':00',
      notes: fullNotes
    };
    
    this.reservationService.createReservation(reservation).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccessMessage('Reserva creada exitosamente. Pendiente de aprobación.');
          this.loadReservations();
          this.resetForm();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error creando reserva:', error);
        const errorMessage = error.error?.message || 'Error al crear la reserva';
        this.showErrorMessage(errorMessage);
        this.loading.set(false);
      }
    });
  }

  showCancelModal = signal(false);
  reservationToCancel = signal<any>(null);
  cancellationReason = signal('');

  openCancelModal(id: string) {
    const reservation = this.reservations().find(r => r.id === id);
    this.reservationToCancel.set(reservation);
    this.cancellationReason.set('');
    this.showCancelModal.set(true);
  }

  cancelReservation() {
    const reservation = this.reservationToCancel();
    if (!reservation) return;
    
    const reason = this.cancellationReason().trim();
    
    if (!reason || reason.length < 10) {
      this.showErrorMessage('El motivo debe tener al menos 10 caracteres');
      return;
    }
    
    this.reservationService.cancelReservation(reservation.id, reason).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccessMessage('Reserva cancelada exitosamente');
          this.loadReservations();
        }
        this.showCancelModal.set(false);
      },
      error: (error) => {
        console.error('Error cancelando reserva:', error);
        this.showErrorMessage('Error al cancelar la reserva');
        this.showCancelModal.set(false);
      }
    });
  }

  resetForm() {
    this.selectedDateStr = '';
    this.startTime = '';
    this.endTime = '';
    this.selectedEventType = '';
    this.notes = '';
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
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
    if (!user) return 'U';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
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

  isOwner(): boolean {
    const user = this.currentUser();
    return user?.role === 'Owner';
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.notificationService.markAsRead(notificationId);
  }

  timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  getEventType(notes: string): string {
    if (!notes) return 'No especificado';
    const match = notes.match(/Tipo: ([^\n]+)/);
    return match ? match[1] : 'No especificado';
  }

  getEventDescription(notes: string): string {
    if (!notes) return '';
    
    // Extraer solo la descripción después del tipo
    const lines = notes.split('\n');
    if (lines.length > 1) {
      // Unir todas las líneas después de la primera (que contiene el tipo)
      const description = lines.slice(1).join('\n').trim();
      return description;
    }
    
    return '';
  }
}