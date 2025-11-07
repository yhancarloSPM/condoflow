import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../core/services/auth.service';
import { AdminPaymentService } from '../../core/services/admin-payment.service';

@Component({
  selector: 'app-payment-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="payments-layout">
      <nav class="top-nav">
        <div class="nav-container">
          <div class="brand" (click)="navigateToHome()" style="cursor: pointer;">
            <div class="brand-icon">
              <i class="pi pi-home"></i>
            </div>
            <span class="brand-name">CondoFlow</span>
          </div>
          <div class="user-section">
            <div class="user-info">
              <div class="user-avatar">{{ getUserInitials() }}</div>
              <div class="user-details">
                <span class="user-name">{{ currentUser()?.firstName }} {{ currentUser()?.lastName }}</span>
                <span class="user-role">Administrador</span>
              </div>
            </div>
            <button type="button" class="logout-button" (click)="logout()">
              <i class="pi pi-sign-out"></i>
            </button>
          </div>
        </div>
      </nav>

      <div class="main-content">
        <div class="page-header">
          <h1>Gestión de Pagos</h1>
          <p>Aprobar o rechazar pagos de propietarios</p>
        </div>

        <!-- Resumen de pagos -->
        <div class="summary-cards">
          <div class="summary-card">
            <div class="summary-icon pending">
              <i class="pi pi-clock"></i>
            </div>
            <div class="summary-info">
              <h3>{{ getPaymentsByStatus('pending').length }}</h3>
              <p>En Revisión</p>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon approved">
              <i class="pi pi-check"></i>
            </div>
            <div class="summary-info">
              <h3>{{ getPaymentsByStatus('approved').length }}</h3>
              <p>Aprobados</p>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon rejected">
              <i class="pi pi-times"></i>
            </div>
            <div class="summary-info">
              <h3>{{ getPaymentsByStatus('rejected').length }}</h3>
              <p>Rechazados</p>
            </div>
          </div>
        </div>

        <!-- Filtros y búsqueda -->
        <div class="filters-card">
          <div class="filters-row">
            <div class="search-box">
              <i class="pi pi-search"></i>
              <input type="text" placeholder="Buscar por propietario..." [ngModel]="searchTerm()" (input)="updateSearchTerm($event)">
            </div>
            <select [ngModel]="statusFilter()" (change)="updateStatusFilter($event)" class="filter-select">
              <option value="">Todos los estados</option>
              <option value="pending">En Revisión</option>
              <option value="approved">Aprobados</option>
              <option value="rejected">Rechazados</option>
            </select>
            <select [ngModel]="sortBy()" (change)="updateSortBy($event)" class="filter-select">
              <option value="date-desc">Más recientes</option>
              <option value="date-asc">Más antiguos</option>
              <option value="amount-desc">Mayor monto</option>
              <option value="amount-asc">Menor monto</option>
            </select>
          </div>
        </div>

        <div class="payments-card">
          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Cargando pagos...</p>
            </div>
          } @else if (filteredPayments().length === 0) {
            <div class="empty-state">
              <i class="pi pi-credit-card"></i>
              <p>{{ payments().length === 0 ? 'No hay pagos registrados' : 'No se encontraron pagos con los filtros aplicados' }}</p>
            </div>
          } @else {
            <div class="payments-list">
              @for (payment of paginatedPayments(); track payment.id) {
                <div class="payment-item" [class]="payment.status">
                  @if (payment.status === 'pending') {
                    <div class="status-indicator pending">
                      <i class="pi pi-clock"></i>
                      <span>EN REVISIÓN</span>
                    </div>
                  } @else if (payment.status === 'approved') {
                    <div class="status-indicator approved">
                      <i class="pi pi-check"></i>
                      <span>APROBADO</span>
                    </div>
                  } @else if (payment.status === 'rejected') {
                    <div class="status-indicator rejected">
                      <i class="pi pi-times"></i>
                      <span>RECHAZADO</span>
                    </div>
                  }
                  <div class="payment-info">
                    <h4>Pago #{{ payment.id.substring(0, 8) }}</h4>
                    <p class="owner-info">{{ payment.ownerName }}</p>
                    <p class="payment-details">{{ payment.paymentMethod }} - {{ payment.paymentDate | date:'dd/MM/yyyy' }}</p>
                    <p class="payment-concept">{{ payment.concept || 'Concepto no especificado' }}</p>
                  </div>
                  <div class="payment-meta">
                    <small class="payment-created">Comprobante enviado: {{ payment.createdAt | date:'short' }}</small>
                  </div>
                  <div class="payment-fixed-right">
                    <div class="payment-details-section">
                      <div class="payment-amount">
                        {{ '$' + payment.amount?.toFixed(2) }}
                        <small>{{ payment.currency || 'DOP' }}</small>
                      </div>
                    </div>
                    <div class="payment-right-section">

                      <div class="payment-buttons">
                        <button 
                          type="button"
                          class="btn-receipt-compact"
                          (click)="viewReceipt(payment)"
                          title="Ver comprobante">
                          <i class="pi pi-file"></i>
                        </button>
                        @if (payment.status === 'pending') {
                          <button 
                            type="button"
                            class="btn-action-compact approve"
                            (click)="showApprovalModal(payment)"
                            [disabled]="processingPayment() === payment.id"
                            title="Aprobar">
                            @if (processingPayment() === payment.id && actionType() === 'approve') {
                              <span class="spinner-border spinner-border-sm"></span>
                            } @else {
                              <i class="pi pi-check"></i>
                            }
                          </button>
                          <button 
                            type="button"
                            class="btn-action-compact reject"
                            (click)="showRejectionModal(payment)"
                            [disabled]="processingPayment() === payment.id"
                            title="Rechazar">
                            @if (processingPayment() === payment.id && actionType() === 'reject') {
                              <span class="spinner-border spinner-border-sm"></span>
                            } @else {
                              <i class="pi pi-times"></i>
                            }
                          </button>
                        }
                      </div>
                    </div>
                  </div>
                  @if (payment.status === 'rejected' && payment.rejectionReason) {
                    <div class="rejection-message-info">
                      <span class="rejection-label">Motivo de rechazo:</span>
                      <div class="rejection-reason" [title]="payment.rejectionReason">
                        "{{ payment.rejectionReason.length > 150 ? payment.rejectionReason.substring(0, 150) + '...' : payment.rejectionReason }}"
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
            
            <!-- Paginación -->
            @if (totalPages() > 1) {
              <div class="pagination-container">
                <div class="pagination-info">
                  <span>Mostrando {{ (currentPage() - 1) * pageSize + 1 }} - {{ Math.min(currentPage() * pageSize, filteredPayments().length) }} de {{ filteredPayments().length }} pagos</span>
                </div>
                <div class="pagination">
                  <button class="pagination-btn" [disabled]="currentPage() === 1" (click)="prevPage()">
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
                  <button class="pagination-btn" [disabled]="currentPage() === totalPages()" (click)="nextPage()">
                    <i class="pi pi-chevron-right"></i>
                  </button>
                </div>
              </div>
            }
          }
        </div>
      </div>
      
      <!-- Modal de Aprobación -->
      @if (showModal() && modalType() === 'approve') {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">
                  <i class="pi pi-check-circle text-success me-2"></i>
                  Aprobar Pago
                </h5>
              </div>
              <div class="modal-body">
                <p>¿Confirmas que deseas aprobar este pago?</p>
                @if (selectedPayment()) {
                  <div class="payment-info-card">
                    <div class="d-flex align-items-center justify-content-between">
                      <div>
                        <div class="fw-semibold">Pago #{{ selectedPayment().id.substring(0, 8) }}</div>
                        <small class="text-muted">{{ selectedPayment().ownerName }}</small>
                      </div>
                      <div class="text-end">
                        <div class="fw-bold text-success">{{ '$' + selectedPayment().amount?.toFixed(2) }}</div>
                        <small class="text-muted">{{ selectedPayment().currency || 'DOP' }}</small>
                      </div>
                    </div>
                  </div>
                }
              </div>
              <div class="modal-footer">
                <button 
                  type="button" 
                  class="btn btn-outline-secondary modal-btn"
                  (click)="closeModal()">
                  Cancelar
                </button>
                <button 
                  type="button" 
                  class="btn btn-outline-success modal-btn"
                  (click)="confirmAction()"
                  [disabled]="processingPayment() !== null">
                  @if (processingPayment() !== null) {
                    <span class="spinner-border spinner-border-sm me-1"></span>
                  }
                  Sí, aprobar
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Modal de Rechazo -->
      @if (showModal() && modalType() === 'reject') {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">
                  <i class="pi pi-exclamation-triangle text-warning me-2"></i>
                  Rechazar Pago
                </h5>
              </div>
              <div class="modal-body">
                <p>¿Estás seguro de que deseas rechazar este pago?</p>
                @if (selectedPayment()) {
                  <div class="payment-info-card">
                    <div class="d-flex align-items-center justify-content-between">
                      <div>
                        <div class="fw-semibold">Pago #{{ selectedPayment().id.substring(0, 8) }}</div>
                        <small class="text-muted">{{ selectedPayment().ownerName }}</small>
                      </div>
                      <div class="text-end">
                        <div class="fw-bold text-danger">{{ '$' + selectedPayment().amount?.toFixed(2) }}</div>
                        <small class="text-muted">{{ selectedPayment().currency || 'DOP' }}</small>
                      </div>
                    </div>
                  </div>
                }
                <div class="form-group">
                  <label for="rejectionReason">Motivo del rechazo *</label>
                  <textarea 
                    id="rejectionReason"
                    [ngModel]="rejectionReason" 
                    (input)="rejectionReason = $any($event.target).value" 
                    class="form-control"
                    rows="3"
                    placeholder="Explica por qué se rechaza este pago..."
                    required>
                  </textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button 
                  type="button" 
                  class="btn btn-outline-secondary modal-btn"
                  (click)="closeModal()">
                  No, mantener
                </button>
                <button 
                  type="button" 
                  class="btn btn-outline-danger modal-btn"
                  (click)="confirmAction()"
                  [disabled]="processingPayment() !== null || !rejectionReason.trim()">
                  @if (processingPayment() !== null) {
                    <span class="spinner-border spinner-border-sm me-1"></span>
                  }
                  Sí, rechazar
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
    <p-toast></p-toast>
  `,
  styles: [`
    .payments-layout { min-height: 100vh; background: #f8fafc; }
    .top-nav { background: white; border-bottom: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); }
    .nav-container { width: 100%; padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; height: 4rem; }
    .brand { display: flex; align-items: center; gap: 0.75rem; }
    .brand-icon { width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 1.5rem; }
    .brand-name { font-size: 1.5rem; font-weight: 700; color: #1f2937; }
    .user-section { display: flex; align-items: center; gap: 1rem; }
    .user-info { display: flex; align-items: center; gap: 0.75rem; }
    .user-avatar { background: linear-gradient(135deg, #10B981, #059669); color: white; font-weight: 600; width: 2.25rem; height: 2.25rem; font-size: 0.875rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .user-details { display: flex; flex-direction: column; }
    .user-name { font-weight: 600; color: #1f2937; font-size: 0.875rem; }
    .user-role { font-size: 0.75rem; color: #6b7280; }
    .logout-button { background: transparent; border: 1px solid #e5e7eb; color: #6b7280; width: 2.25rem; height: 2.25rem; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; }
    .logout-button:hover { border-color: #fca5a5; color: #ef4444; background: #fef2f2; }
    .main-content { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .page-header h1 { font-size: 2rem; font-weight: 700; color: #1f2937; margin: 0 0 0.5rem 0; }
    .page-header p { color: #6b7280; margin: 0 0 2rem 0; }
    .payments-card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
    .payments-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .payment-item { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; transition: all 0.2s ease; background: white; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
    .rejection-message-info { flex-basis: 100%; order: 3; }
    .payment-actions { min-width: 120px; }

    .payment-item.pending { border-left: 4px solid #f59e0b; }
    .payment-item.approved { border-left: 4px solid #10B981; }
    .payment-item.rejected { border-left: 4px solid #ef4444; }
    
    /* Indicadores de estado */
    .status-indicator {
      position: absolute;
      top: -8px;
      right: 1rem;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .status-indicator.pending {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
      animation: pulse 2s infinite;
    }
    .status-indicator.approved {
      background: #10B981;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
    }
    .status-indicator.rejected {
      background: #ef4444;
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
    }
    
    .payment-item {
      position: relative;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }
    .payment-info h4 { font-size: 1rem; font-weight: 600; color: #1f2937; margin: 0 0 0.25rem 0; }
    .owner-info { font-weight: 500; color: #1f2937; margin: 0 0 0.25rem 0; font-size: 0.875rem; }
    .payment-details { color: #6b7280; margin: 0; font-size: 0.875rem; }
    .payment-amount { font-size: 1.25rem; font-weight: 600; color: #1f2937; }
    .payment-fixed-right { display: flex; flex-direction: column; align-items: flex-end; gap: 1rem; align-self: flex-start; width: 250px; flex-shrink: 0; }
    .payment-right-section { display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-start; gap: 0.5rem; }
    .payment-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; }
    .payment-buttons { display: flex; justify-content: flex-end; gap: 0.5rem; }
    .payment-buttons .btn { min-width: 2.5rem; height: 2.5rem; padding: 0; display: flex; align-items: center; justify-content: center; }
    .btn-receipt-compact { background: #f3f4f6; color: #6b7280; border: none; min-width: 2.5rem; height: 2.5rem; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; }
    .btn-receipt-compact:hover { background: #e5e7eb; color: #374151; }
    .bg-orange { background: linear-gradient(135deg, #f59e0b, #d97706) !important; color: white !important; }
    .bg-success { background-color: #198754 !important; color: white !important; }
    .bg-danger { background-color: #dc3545 !important; color: white !important; }
    .text-success { color: #10B981; }
    .text-danger { color: #ef4444; }
    .text-muted { color: #6b7280; }

    .me-2 { margin-right: 0.5rem; }
    .me-1 { margin-right: 0.25rem; }
    .spinner-border { width: 1rem; height: 1rem; border: 2px solid transparent; border-top: 2px solid currentColor; border-radius: 50%; animation: spin 1s linear infinite; }
    .spinner-border-sm { width: 0.875rem; height: 0.875rem; }

    .payment-info { position: relative; padding-bottom: 1rem; flex: 1; }
    .rejection-label { color: #ef4444; font-weight: 600; margin-right: 0.5rem; }
    .rejection-message-info { width: 100%; padding: 0.5rem; margin-top: 0.5rem; display: block; }
    .rejection-reason { color: #6b7280; font-size: 0.75rem; font-style: italic; cursor: help; display: block; word-wrap: break-word; width: 100%; }
    .btn { padding: 0.375rem 0.5rem; border-radius: 6px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 0.25rem; border: none; font-size: 0.875rem; text-decoration: none; }

    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .badge { padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 500; align-self: flex-end; }
    .badge.pending { background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; }
    .badge.approved { background: #d1fae5; color: #065f46; border: 1px solid #10B981; }
    .badge.rejected { background: #fee2e2; color: #991b1b; border: 1px solid #ef4444; }
    .spinner-sm { width: 1rem; height: 1rem; border: 2px solid transparent; border-top: 2px solid currentColor; border-radius: 50%; animation: spin 1s linear infinite; }
    .loading-state, .empty-state { text-align: center; padding: 3rem 1rem; color: #6b7280; }
    .spinner { width: 2rem; height: 2rem; border: 2px solid #e5e7eb; border-top: 2px solid #2563EB; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem auto; }
    .empty-state i { font-size: 3rem; margin-bottom: 1rem; color: #d1d5db; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    /* Summary Cards - Compact */
    .summary-cards { display: flex; gap: 1rem; margin-bottom: 1.5rem; justify-content: flex-start; }
    .summary-card { background: white; border-radius: 8px; padding: 1.75rem 2rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; display: flex; align-items: center; gap: 1.25rem; transition: all 0.2s ease; min-width: 220px; }
    .summary-card:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
    .summary-icon { width: 2rem; height: 2rem; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; color: white; flex-shrink: 0; }
    .summary-icon.pending { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .summary-icon.approved { background: linear-gradient(135deg, #10B981, #059669); }
    .summary-icon.rejected { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .summary-info h3 { font-size: 1.125rem; font-weight: 600; color: #1f2937; margin: 0; line-height: 1.2; }
    .summary-info p { color: #6b7280; margin: 0; font-size: 0.75rem; line-height: 1.2; white-space: nowrap; }
    
    /* Filtros */
    .filters-card { background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
    .filters-row { display: flex; gap: 1rem; align-items: center; }
    .search-box { position: relative; flex: 1; }
    .search-box i { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #6b7280; }
    .search-box input { width: 100%; padding: 0.5rem 0.75rem 0.5rem 2.5rem; border: 1px solid #d1d5db; border-radius: 6px; }
    .filter-select { padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; background: white; }

    /* Detalles mejorados */
    .payment-details-section { display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; text-align: right; }
    .payment-amount { font-size: 1.5rem; font-weight: 700; color: #1f2937; font-family: 'Segoe UI', system-ui, sans-serif; letter-spacing: -0.025em; display: flex; align-items: baseline; gap: 0.5rem; }
    .payment-amount small { font-size: 0.75rem; font-weight: 600; color: #6b7280; background: #f8fafc; padding: 0.25rem 0.5rem; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    .payment-concept { color: #4b5563; font-size: 0.875rem; margin: 0.25rem 0; }
    .payment-created { color: #9ca3af; flex: 1; }
    .payment-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 1rem; gap: 1rem; position: relative; width: 100%; min-height: 2rem; flex-basis: 100%; order: 2; }

    .badge i { font-size: 0.875rem; }

    /* Modal */
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
    .text-success { color: #10B981; }
    .text-warning { color: #f59e0b; }

    .payment-info-card {
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

    .btn-action-compact.approve {
      background: #d1fae5;
      color: #065f46;
    }

    .btn-action-compact.approve:hover:not(:disabled) {
      background: #10b981;
      color: white;
      transform: translateY(-1px);
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

    /* Paginación */
    .pagination-container { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-top: 1px solid #e5e7eb; }
    .pagination { display: flex; gap: 0.5rem; }
    .pagination-btn { padding: 0.5rem 0.75rem; border: 1px solid #e5e7eb; background: white; color: #6b7280; border-radius: 6px; cursor: pointer; }
    .pagination-btn:hover:not(:disabled) { border-color: #2563EB; color: #2563EB; }
    .pagination-btn.active { background: #2563EB; color: white; border-color: #2563EB; }
    .pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .pagination-dots { padding: 0.5rem 0.75rem; color: #6b7280; font-weight: 500; }



    @media (max-width: 768px) {
      .filters-row { flex-direction: column; align-items: stretch; }
      .stats-row { justify-content: space-around; }
      .payment-item { flex-direction: column; gap: 1rem; }
      .payment-details-section { align-items: flex-start; }
      .pending-indicator { position: static; margin-bottom: 0.5rem; }
    }
  `]
})
export class PaymentManagementComponent implements OnInit {
  currentUser = signal<any>(null);
  payments = signal<any[]>([]);
  loading = signal(false);
  processingPayment = signal<string | null>(null);
  
  // Filtros y búsqueda
  searchTerm = signal('');
  statusFilter = signal('');
  sortBy = signal('date-desc');
  
  // Paginación
  currentPage = signal(1);
  pageSize = 10;
  
  // Modal
  showModal = signal(false);
  modalType = signal<'approve' | 'reject'>('approve');
  selectedPayment = signal<any>(null);
  rejectionReason = '';
  actionType = signal<'approve' | 'reject' | null>(null);
  openDropdown = signal<string | null>(null);
  
  // Computed properties
  filteredPayments = computed(() => {
    let filtered = this.payments();
    
    // Filtro por búsqueda
    if (this.searchTerm()) {
      const searchLower = this.searchTerm().toLowerCase();
      filtered = filtered.filter(p => 
        (p.ownerName || '').toLowerCase().includes(searchLower) ||
        (p.paymentMethod || '').toLowerCase().includes(searchLower) ||
        (p.concept || '').toLowerCase().includes(searchLower)
      );
    }
    
    // Filtro por estado
    if (this.statusFilter()) {
      filtered = filtered.filter(p => p.status === this.statusFilter());
    }
    
    // Ordenamiento normal
    filtered.sort((a, b) => {
      switch (this.sortBy()) {
        case 'date-desc': 
          const dateA = new Date(a.createdAt || a.paymentDate);
          const dateB = new Date(b.createdAt || b.paymentDate);
          return dateB.getTime() - dateA.getTime();
        case 'date-asc': 
          const dateA2 = new Date(a.createdAt || a.paymentDate);
          const dateB2 = new Date(b.createdAt || b.paymentDate);
          return dateA2.getTime() - dateB2.getTime();
        case 'amount-desc': 
          return (b.amount || 0) - (a.amount || 0);
        case 'amount-asc': return (a.amount || 0) - (b.amount || 0);
        default: return 0;
      }
    });
    
    return filtered;
  });
  
  totalPages = computed(() => Math.ceil(this.filteredPayments().length / this.pageSize));
  
  paginatedPayments = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredPayments().slice(start, end);
  });

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private adminPaymentService: AdminPaymentService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.currentUser.set(this.authService.currentUser());
    
    // Leer query parameters para filtro inicial
    this.route.queryParams.subscribe(params => {
      if (params['status']) {
        this.statusFilter.set(params['status']);
      }
    });
    
    this.loadAllPayments();
  }

  loadAllPayments() {
    this.loading.set(true);
    this.adminPaymentService.getAllPayments().subscribe({
      next: (response) => {
        if (response.success) {
          const paymentsWithOwnerInfo = response.data.map((payment: any) => ({
            id: payment.id,
            ownerName: payment.ownerName,
            amount: payment.amount,
            currency: payment.currency,
            paymentMethod: payment.paymentMethod,
            paymentDate: new Date(payment.paymentDate),
            createdAt: new Date(payment.createdAt),
            status: payment.status,
            receiptUrl: payment.receiptUrl,
            concept: payment.concept || 'Cuota de mantenimiento',
            rejectionReason: payment.rejectionReason,
            processedAt: payment.processedAt ? new Date(payment.processedAt) : null
          }));
          this.payments.set(paymentsWithOwnerInfo);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando pagos:', error);
        this.loading.set(false);
      }
    });
  }

  updateSearchTerm(event: any) {
    this.searchTerm.set(event.target.value);
    this.currentPage.set(1);
  }
  
  updateStatusFilter(event: any) {
    this.statusFilter.set(event.target.value);
    this.currentPage.set(1);
  }
  
  updateSortBy(event: any) {
    this.sortBy.set(event.target.value);
    this.currentPage.set(1);
    // Forzar actualización
    const currentPayments = this.payments();
    this.payments.set([...currentPayments]);
  }
  
  getPaymentsByStatus(status: string) {
    return this.payments().filter(p => p.status === status);
  }
  
  viewReceipt(payment: any) {
    if (payment.id) {
      const token = this.authService.getToken();
      const url = `https://localhost:7009/api/receipts/${payment.id}?access_token=${token}`;
      window.open(url, '_blank');
    }
  }
  
  showApprovalModal(payment: any) {
    this.selectedPayment.set(payment);
    this.modalType.set('approve');
    this.showModal.set(true);
  }
  
  showRejectionModal(payment: any) {
    this.selectedPayment.set(payment);
    this.modalType.set('reject');
    this.rejectionReason = '';
    this.showModal.set(true);
  }
  
  closeModal() {
    this.showModal.set(false);
    this.selectedPayment.set(null);
    this.rejectionReason = '';
  }
  
  confirmAction() {
    const payment = this.selectedPayment();
    if (!payment) return;
    
    if (this.modalType() === 'approve') {
      this.approvePayment(payment.id);
    } else {
      if (!this.rejectionReason.trim()) {
        return; // No hacer nada si no hay razón
      }
      this.rejectPayment(payment.id);
    }
    this.closeModal();
  }
  
  approvePayment(paymentId: string) {
    this.processingPayment.set(paymentId);
    this.actionType.set('approve');
    this.adminPaymentService.approvePayment(paymentId).subscribe({
      next: (response) => {
        if (response.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Pago Aprobado',
            detail: 'El pago ha sido aprobado exitosamente'
          });
          this.loadAllPayments();
        }
        this.processingPayment.set(null);
        this.actionType.set(null);
      },
      error: (error) => {
        console.error('Error aprobando pago:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al aprobar el pago'
        });
        this.processingPayment.set(null);
        this.actionType.set(null);
      }
    });
  }

  rejectPayment(paymentId: string) {
    this.processingPayment.set(paymentId);
    this.actionType.set('reject');
    this.adminPaymentService.rejectPayment(paymentId, this.rejectionReason).subscribe({
      next: (response) => {
        if (response.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Pago Rechazado',
            detail: 'El pago ha sido rechazado exitosamente'
          });
          this.loadAllPayments();
        }
        this.processingPayment.set(null);
        this.actionType.set(null);
      },
      error: (error) => {
        console.error('Error rechazando pago:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al rechazar el pago'
        });
        this.processingPayment.set(null);
        this.actionType.set(null);
      }
    });
  }
  
  // Paginación
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }
  
  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.goToPage(this.currentPage() + 1);
    }
  }
  
  prevPage() {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
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

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'A';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  getStatusClass(status: string): string {
    return `badge ${status}`;
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'En Revisión',
      'approved': 'Aprobado',
      'rejected': 'Rechazado'
    };
    return statusMap[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'approved': 'badge bg-success',
      'rejected': 'badge bg-danger'
    };
    return classMap[status] || 'badge';
  }
  
  getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'pending': 'pi-clock',
      'approved': 'pi-check',
      'rejected': 'pi-times'
    };
    return iconMap[status] || 'pi-circle';
  }

  navigateToHome(): void {
    this.router.navigate(['/welcome']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }

  toggleDropdown(paymentId: string) {
    this.openDropdown.set(this.openDropdown() === paymentId ? null : paymentId);
  }

  selectAction(payment: any, action: 'approve' | 'reject') {
    this.openDropdown.set(null);
    if (action === 'approve') {
      this.showApprovalModal(payment);
    } else {
      this.showRejectionModal(payment);
    }
  }


}