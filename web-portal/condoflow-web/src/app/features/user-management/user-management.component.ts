import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MenubarModule } from 'primeng/menubar';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ToastModule } from 'primeng/toast';

import { MenuItem, MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { AdminService } from '../../core/services/admin.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    CardModule,
    TagModule,
    MenubarModule,
    AvatarModule,
    BadgeModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <div class="dashboard-layout">
      <!-- Top Navigation -->
      <nav class="top-nav">
        <div class="nav-container">
          <!-- Brand -->
          <div class="brand" (click)="navigateToHome()" style="cursor: pointer;">
            <div class="brand-icon">
              <i class="pi pi-home"></i>
            </div>
            <span class="brand-name">CondoFlow</span>
          </div>

          <!-- Navigation Items -->
          <div class="nav-items">
          </div>

          <!-- User Section -->
          <div class="user-section">


            <div class="user-info">
              <p-avatar 
                [label]="getUserInitials()" 
                styleClass="user-avatar"
                shape="circle">
              </p-avatar>
              <div class="user-details">
                <span class="user-name">{{ currentUser()?.firstName }} {{ currentUser()?.lastName }}</span>
                <span class="user-role">{{ isAdmin() ? 'Administrador' : 'Propietario' }}</span>
              </div>
            </div>
            <button 
              pButton 
              type="button" 
              icon="pi pi-sign-out" 
              class="logout-button"
              (click)="logout()"
              pTooltip="Cerrar Sesión"
              tooltipPosition="bottom">
            </button>
          </div>
        </div>
      </nav>

      <div class="dashboard-container">

      <div class="dashboard-content">
        @if (isAdmin()) {
          <div class="row mb-3">
            <div class="col-12">
              <div class="header-card">
                <div class="header-content">
                  <div class="header-info">
                    <div class="header-icon">
                      <i class="pi pi-users"></i>
                    </div>
                    <div class="header-text">
                      <h2 class="header-title">Gestión de Usuarios</h2>
                      <p class="header-subtitle">Administra y supervisa todos los usuarios del sistema</p>
                    </div>
                  </div>
                  
                  <div class="filters-section">
                    <div class="filter-group">
                      <div class="filter-item">
                        <label class="filter-label">Estado</label>
                        <select [(ngModel)]="statusFilter" (change)="applyFilters()" class="filter-select">
                          <option value="">Todos</option>
                          <option value="pending">Pendientes</option>
                          <option value="approved">Aprobados</option>
                          <option value="rejected">Rechazados</option>
                        </select>
                      </div>
                      
                      <div class="filter-item search-item">
                        <label class="filter-label">Buscar</label>
                        <div class="search-input-wrapper">
                          <i class="pi pi-search search-icon"></i>
                          <input type="text" [(ngModel)]="searchTerm" (input)="applyFilters()" 
                                 class="search-input" placeholder="Nombre o email...">
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="users-card">
            <div class="card-header bg-white">
              <div class="d-flex justify-content-between align-items-center">
                <h5 class="mb-0 text-dark"><i class="pi pi-users me-2" style="color: #10b981;"></i>Usuarios del Sistema</h5>
                <div class="d-flex gap-2">
                  <div class="text-center">
                    <div class="badge bg-warning text-dark fw-bold">{{ statusCounts().pending }}</div>
                    <div><small class="text-muted">Pendientes</small></div>
                  </div>
                  <div class="text-center">
                    <div class="badge bg-success text-white fw-bold">{{ statusCounts().approved }}</div>
                    <div><small class="text-muted">Aprobados</small></div>
                  </div>
                  <div class="text-center">
                    <div class="badge bg-danger text-white fw-bold">{{ statusCounts().rejected }}</div>
                    <div><small class="text-muted">Rechazados</small></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-body d-flex flex-column table-container">
              @if (loading()) {
                <div class="text-center py-5 flex-grow-1 d-flex flex-column justify-content-center">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                  </div>
                  <p class="text-muted mt-2">Cargando usuarios...</p>
                </div>
              } @else if (paginatedUsers().length === 0) {
                <div class="text-center py-5 flex-grow-1 d-flex flex-column justify-content-center">
                  <i class="pi pi-users text-muted" style="font-size: 4rem;"></i>
                  <h6 class="text-muted mt-3">No hay usuarios</h6>
                  <p class="text-muted small">No se encontraron usuarios con los filtros aplicados</p>
                </div>
              } @else {
                <div class="table-responsive" style="flex: 1; overflow-y: auto; min-height: 0;">
                  <table class="table table-striped">
                    <thead class="sticky-top bg-white">
                      <tr>
                        <th>Usuario</th>
                        <th>Teléfono</th>
                        <th>Ubicación</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th class="text-center" style="padding-right: 1.5rem;">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (user of paginatedUsers(); track user.id) {
                        <tr>
                          <td>
                            <div class="d-flex align-items-center">
                              <div class="avatar-circle me-3">
                                {{ getInitials(user.firstName, user.lastName) }}
                              </div>
                              <div>
                                <div class="fw-semibold">{{ user.firstName }} {{ user.lastName }}</div>
                                <small class="text-muted">{{ user.email }}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span class="text-muted">{{ user.phoneNumber || 'N/A' }}</span>
                          </td>
                          <td>
                            <span class="text-muted">{{ (user.block && user.apartment) ? user.block + ' ' + user.apartment : 'N/A' }}</span>
                          </td>
                          <td>
                            <small class="text-muted">{{ user.createdAt | date:'short' }}</small>
                          </td>
                          <td>
                            @if (user.isApproved) {
                              <span class="status-badge status-approved">
                                Aprobado
                              </span>
                            } @else if (user.isRejected) {
                              <span class="status-badge status-rejected">
                                Rechazado
                              </span>
                            } @else {
                              <span class="status-badge status-pending">
                                Pendiente
                              </span>
                            }
                          </td>
                          <td class="text-center" style="padding-right: 1.5rem;">
                            @if (user.isApproved) {
                              <!-- Usuario aprobado: mostrar botón para rechazar -->
                              <div class="d-flex justify-content-end">
                                <button 
                                  type="button"
                                  class="btn-action-compact reject"
                                  (click)="rejectUser(user.id)"
                                  [disabled]="rejectingUser() === user.id"
                                  title="Rechazar Usuario"
                                >
                                  @if (rejectingUser() === user.id) {
                                    <span class="spinner-border spinner-border-sm"></span>
                                  } @else {
                                    <i class="pi pi-times"></i>
                                  }
                                </button>
                              </div>
                            } @else if (user.isRejected) {
                              <!-- Usuario rechazado: mostrar botón para aprobar -->
                              <div class="d-flex justify-content-end">
                                <button 
                                  type="button"
                                  class="btn-action-compact approve"
                                  (click)="approveUser(user.id)"
                                  [disabled]="approvingUser() === user.id"
                                  title="Aprobar Usuario"
                                >
                                  @if (approvingUser() === user.id) {
                                    <span class="spinner-border spinner-border-sm"></span>
                                  } @else {
                                    <i class="pi pi-check"></i>
                                  }
                                </button>
                              </div>
                            } @else {
                              <!-- Usuario pendiente: mostrar ambos botones -->
                              <div class="d-flex gap-1 justify-content-end">
                                <button 
                                  type="button"
                                  class="btn-action-compact approve"
                                  (click)="approveUser(user.id)"
                                  [disabled]="approvingUser() === user.id || rejectingUser() === user.id"
                                  title="Aprobar"
                                >
                                  @if (approvingUser() === user.id) {
                                    <span class="spinner-border spinner-border-sm"></span>
                                  } @else {
                                    <i class="pi pi-check"></i>
                                  }
                                </button>
                                <button 
                                  type="button"
                                  class="btn-action-compact reject"
                                  (click)="rejectUser(user.id)"
                                  [disabled]="approvingUser() === user.id || rejectingUser() === user.id"
                                  title="Rechazar"
                                >
                                  @if (rejectingUser() === user.id) {
                                    <span class="spinner-border spinner-border-sm"></span>
                                  } @else {
                                    <i class="pi pi-times"></i>
                                  }
                                </button>
                              </div>
                            }
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
                        Mostrando {{ (currentPage() - 1) * pageSize + 1 }} - {{ Math.min(currentPage() * pageSize, filteredUsers().length) }} de {{ filteredUsers().length }} usuarios
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
        } @else {
          <p-card header="Dashboard Propietario" styleClass="users-card">
            <div class="owner-welcome">
              <i class="pi pi-home welcome-icon"></i>
              <h3>Bienvenido, {{ currentUser()?.firstName }}!</h3>
              <p>Panel de propietario en desarrollo...</p>
            </div>
          </p-card>
        }
      </div>
    </div>
    <p-toast></p-toast>

    <!-- Confirmation Modal -->
    @if (showConfirmDialog()) {
      <div class="modal-backdrop" (click)="cancelConfirmation()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="pi pi-exclamation-triangle text-warning me-2"></i>
                Confirmar Acción
              </h5>
            </div>
            <div class="modal-body">
              <p>{{ confirmMessage() }}</p>
              @if (pendingUserInfo()) {
                <div class="user-info-card">
                  <div class="d-flex align-items-center">
                    <div class="avatar-circle me-3">
                      {{ getInitials(pendingUserInfo().firstName, pendingUserInfo().lastName) }}
                    </div>
                    <div>
                      <div class="fw-semibold">{{ pendingUserInfo().firstName }} {{ pendingUserInfo().lastName }}</div>
                      <small class="text-muted">{{ pendingUserInfo().email }}</small>
                    </div>
                  </div>
                </div>
              }
            </div>
            <div class="modal-footer">
              <button 
                type="button" 
                class="btn btn-outline-secondary modal-btn"
                (click)="cancelConfirmation()">
                Cancelar
              </button>
              <button 
                type="button" 
                [class]="confirmAction() === 'approve' ? 'btn btn-outline-success modal-btn' : 'btn btn-outline-danger modal-btn'"
                (click)="executeConfirmation()"
                [disabled]="executingAction()">
                @if (executingAction()) {
                  <span class="spinner-border spinner-border-sm me-1"></span>
                }
                {{ confirmAction() === 'approve' ? 'Aprobar' : 'Rechazar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .dashboard-layout {
      height: 100vh;
      background: #f8fafc;
      overflow: hidden;
    }

    .dashboard-container {
      padding: 1rem 2rem 2rem 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Top Navigation */
    .top-nav {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .nav-container {
      width: 100%;
      padding: 0 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 4rem;
    }

    /* Brand */
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-icon {
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      font-size: 1.5rem;
    }

    .brand-name {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
    }

    /* Navigation Items */
    .nav-items {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .back-button {
      background: transparent;
      border: 1px solid #e5e7eb;
      color: #6b7280;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .back-button:hover {
      border-color: #2563EB;
      color: #2563EB;
      background: #eff6ff;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1.25rem;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 500;
      font-size: 0.875rem;
      transition: all 0.3s ease;
      position: relative;
      border: 1px solid transparent;
    }

    .nav-item:hover {
      background: #f8fafc;
      border-color: #e5e7eb;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .nav-item.active {
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      border-color: #bfdbfe;
      box-shadow: 0 2px 12px rgba(37, 99, 235, 0.15);
    }

    .nav-icon {
      width: 2rem;
      height: 2rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      transition: all 0.3s ease;
    }

    .dashboard-icon {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
    }

    .users-icon {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
    }

    .payments-icon {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
    }

    .nav-label {
      color: #374151;
      font-weight: 600;
      letter-spacing: -0.01em;
    }

    .nav-item:hover .nav-icon {
      transform: scale(1.05);
    }

    .nav-item.active .nav-label {
      color: #1e40af;
    }

    .nav-item:hover .nav-label {
      color: #1f2937;
    }

    /* User Section */
    .user-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar {
      background: linear-gradient(135deg, #10B981, #059669) !important;
      color: white !important;
      font-weight: 600 !important;
      width: 2.25rem !important;
      height: 2.25rem !important;
      font-size: 0.875rem !important;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .user-name {
      font-weight: 600;
      color: #1f2937;
      font-size: 0.875rem;
      line-height: 1.2;
    }

    .user-role {
      font-size: 0.75rem;
      color: #6b7280;
      line-height: 1.2;
    }

    .logout-button {
      background: transparent !important;
      border: 1px solid #e5e7eb !important;
      color: #6b7280 !important;
      width: 2.25rem !important;
      height: 2.25rem !important;
      border-radius: 6px !important;
      padding: 0 !important;
      transition: all 0.2s ease !important;
    }

    .logout-button:hover {
      border-color: #fca5a5 !important;
      color: #ef4444 !important;
      background: #fef2f2 !important;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .nav-container {
        padding: 0 1rem;
      }
      
      .nav-items {
        display: none;
      }
      
      .user-details {
        display: none;
      }
      
      .brand-name {
        font-size: 1.25rem;
      }
    }

    .dashboard-content {
      display: flex;
      flex-direction: column;
    }



    .users-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border: 1px solid #e5e7eb;
    }

    :host ::ng-deep .elegant-table .p-datatable-thead > tr > th {
      background: #f8fafc;
      color: #374151;
      font-weight: 600;
      border-bottom: 2px solid #e5e7eb;
      padding: 1rem;
    }

    :host ::ng-deep .elegant-table .p-datatable-tbody > tr > td {
      padding: 1rem;
      border-bottom: 1px solid #f3f4f6;
    }

    :host ::ng-deep .elegant-table .p-datatable-tbody > tr:hover {
      background: #f9fafb;
    }

    .user-avatar-sm {
      background: #10B981 !important;
      color: white !important;
      font-size: 0.75rem !important;
      width: 2rem !important;
      height: 2rem !important;
    }

    .user-info .user-name {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .user-info .user-email {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .contact-info {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .contact-info i {
      margin-right: 0.5rem;
      color: #9ca3af;
    }

    .residence-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .residence-info .apartment {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .empty-message {
      text-align: center;
      padding: 3rem 1rem;
    }

    .empty-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .empty-icon {
      font-size: 3rem;
      color: #d1d5db;
    }

    .empty-content h4 {
      margin: 0;
      color: #374151;
      font-weight: 600;
    }

    .empty-content p {
      margin: 0;
      color: #6b7280;
      font-size: 0.875rem;
    }

    :host ::ng-deep .p-button-success {
      background: #10B981 !important;
      border-color: #10B981 !important;
    }

    :host ::ng-deep .p-button-success:hover {
      background: #059669 !important;
      border-color: #059669 !important;
    }

    .owner-welcome {
      text-align: center;
      padding: 3rem 2rem;
    }

    .welcome-icon {
      font-size: 4rem;
      color: #2563EB;
      margin-bottom: 1rem;
    }

    .owner-welcome h3 {
      color: #1f2937;
      margin: 0 0 1rem 0;
      font-size: 1.5rem;
    }

    .owner-welcome p {
      color: #6b7280;
      margin: 0;
    }

    .avatar-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10B981, #059669);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .table th {
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
      padding: 1rem 0.75rem;
      background-color: white;
    }

    .table td {
      padding: 1rem 0.75rem;
      vertical-align: middle;
    }

    .btn-group .btn {
      padding: 0.375rem 0.5rem;
    }

    .badge {
      font-size: 0.75rem;
    }

    .processed-action {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
    }

    .processed-action i {
      font-size: 0.875rem;
    }



    /* Paginación */
    .pagination-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-top: 1px solid #e5e7eb;
      background: #f8fafc;
    }

    .pagination-info {
      font-size: 0.875rem;
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
      border-color: #10b981;
      color: #10b981;
      background: #ecfdf5;
    }

    .pagination-btn.active {
      background: #10b981;
      color: white;
      border-color: #10b981;
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

    @media (max-width: 768px) {
      .pagination-container {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }
      
      .pagination {
        gap: 0.25rem;
      }
      
      .pagination-btn {
        padding: 0.375rem 0.5rem;
        font-size: 0.75rem;
        min-width: 2rem;
      }
    }

    /* Confirmation Modal */
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
      max-width: 400px;
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

    .user-info-card {
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

    .btn-action-compact.approve:hover:not(:disabled) {
      background: #10b981;
      color: white;
      transform: translateY(-1px);
    }

    .btn-action-compact.reject {
      border-color: #ef4444;
      color: #ef4444;
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

    .spinner-border-sm {
      width: 1rem;
      height: 1rem;
      border-width: 0.125rem;
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

    /* Status Badges */
    .status-badge {
      padding: 0.35rem 0.65rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 400;
      border: 1px solid;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      min-width: 85px;
      text-align: center;
    }

    .status-approved {
      background-color: #d1fae5;
      color: #065f46;
      border-color: #10b981;
    }

    .status-rejected {
      background-color: #fee2e2;
      color: #991b1b;
      border-color: #ef4444;
    }

    .status-pending {
      background-color: #fef3c7;
      color: #92400e;
      border-color: #f59e0b;
    }

    /* Subtle Status Badges for Header */
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

    .table-container {
      height: calc(100vh - 420px);
    }

    @media (max-width: 1200px) {
      .table-container {
        height: calc(100vh - 400px);
      }
    }

    @media (max-width: 768px) {
      .table-container {
        height: calc(100vh - 360px);
      }
    }

    .card {
      border: none;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .card-body { padding: 1rem; }
    .table-responsive { overflow-x: auto; max-width: 100%; }
    .table { table-layout: fixed; width: 100%; }
    .table th, .table td { padding: 0.75rem; font-size: 0.875rem; overflow: hidden; text-overflow: ellipsis; }
    .card-header { background: #f8f9fa; border-bottom: 1px solid #dee2e6; padding: 1rem; }

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
      background: linear-gradient(135deg, #10b981, #059669);
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
      flex: 0 0 40%;
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
export class UserManagementComponent implements OnInit, OnDestroy {
  allUsers = signal<any[]>([]);
  filteredUsers = signal<any[]>([]);
  loading = signal(false);
  approvingUser = signal<string | null>(null);
  rejectingUser = signal<string | null>(null);
  currentUser = signal<any>(null);
  currentPage = signal(1);
  pageSize = 10;
  statusFilter = '';
  searchTerm = '';
  
  paginatedUsers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredUsers().slice(start, end);
  });
  
  totalPages = computed(() => Math.ceil(this.filteredUsers().length / this.pageSize));
  
  statusCounts = computed(() => {
    const users = this.allUsers();
    return {
      pending: users.filter(u => !u.isApproved && !u.isRejected).length,
      approved: users.filter(u => u.isApproved).length,
      rejected: users.filter(u => u.isRejected).length
    };
  });
  menuItems: MenuItem[] = [];
  showConfirmDialog = signal(false);
  confirmMessage = signal('');
  confirmAction = signal<'approve' | 'reject'>('approve');
  pendingUserId = signal<string | null>(null);
  pendingUserInfo = signal<any>(null);
  executingAction = signal(false);

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router,
    public notificationService: NotificationService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    this.currentUser.set(this.authService.user());
    if (this.isAdmin()) {
      this.loadAllUsers();
    }
    
    // Iniciar conexión de notificaciones
    await this.notificationService.startConnection();
  }

  async ngOnDestroy() {
    await this.notificationService.stopConnection();
  }



  loadAllUsers() {
    this.loading.set(true);
    this.adminService.getAllUsers().subscribe({
      next: (response) => {
        if (response.success) {
          // Ordenar: pendientes primero, luego por fecha
          const sortedUsers = response.data.sort((a: any, b: any) => {
            // Pendientes primero
            if (!a.isApproved && !a.isRejected && (b.isApproved || b.isRejected)) return -1;
            if ((a.isApproved || a.isRejected) && !b.isApproved && !b.isRejected) return 1;
            // Luego por fecha (más recientes primero)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          
          this.allUsers.set(sortedUsers);
          this.applyFilters();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando usuarios:', error);
        this.loading.set(false);
      }
    });
  }

  applyFilters() {
    let filtered = [...this.allUsers()];
    
    if (this.statusFilter) {
      if (this.statusFilter === 'pending') {
        filtered = filtered.filter(u => !u.isApproved && !u.isRejected);
      } else if (this.statusFilter === 'approved') {
        filtered = filtered.filter(u => u.isApproved);
      } else if (this.statusFilter === 'rejected') {
        filtered = filtered.filter(u => u.isRejected);
      }
    }
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.firstName.toLowerCase().includes(term) || 
        u.lastName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    }
    
    this.filteredUsers.set(filtered);
    this.currentPage.set(1);
  }

  approveUser(userId: string) {
    const user = this.paginatedUsers().find(u => u.id === userId);
    this.pendingUserInfo.set(user);
    this.confirmMessage.set('¿Está seguro que desea aprobar este usuario?');
    this.confirmAction.set('approve');
    this.pendingUserId.set(userId);
    this.showConfirmDialog.set(true);
  }

  rejectUser(userId: string) {
    const user = this.paginatedUsers().find(u => u.id === userId);
    this.pendingUserInfo.set(user);
    this.confirmMessage.set('¿Está seguro que desea rechazar este usuario?');
    this.confirmAction.set('reject');
    this.pendingUserId.set(userId);
    this.showConfirmDialog.set(true);
  }

  executeConfirmation() {
    const userId = this.pendingUserId();
    if (!userId) return;

    this.executingAction.set(true);
    
    if (this.confirmAction() === 'approve') {
      this.approvingUser.set(userId);
      this.adminService.approveUser(userId).subscribe({
        next: (response) => {
          if (response.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Usuario Aprobado',
              detail: 'El usuario ha sido aprobado exitosamente'
            });
            this.loadAllUsers();
          }
          this.approvingUser.set(null);
          this.executingAction.set(false);
          this.showConfirmDialog.set(false);
        },
        error: (error) => {
          console.error('Error aprobando:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al aprobar el usuario'
          });
          this.approvingUser.set(null);
          this.executingAction.set(false);
          this.showConfirmDialog.set(false);
        }
      });
    } else {
      this.rejectingUser.set(userId);
      this.adminService.rejectUser(userId).subscribe({
        next: (response) => {
          if (response.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Usuario Rechazado',
              detail: 'El usuario ha sido rechazado exitosamente'
            });
            this.loadAllUsers();
          }
          this.rejectingUser.set(null);
          this.executingAction.set(false);
          this.showConfirmDialog.set(false);
        },
        error: (error) => {
          console.error('Error rechazando:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al rechazar el usuario'
          });
          this.rejectingUser.set(null);
          this.executingAction.set(false);
          this.showConfirmDialog.set(false);
        }
      });
    }
  }

  cancelConfirmation() {
    this.showConfirmDialog.set(false);
    this.pendingUserId.set(null);
    this.pendingUserInfo.set(null);
    this.executingAction.set(false);
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'U';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }

  getInitials(firstName: string, lastName: string): string {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  isAdmin(): boolean {
    const user = this.currentUser();
    return user?.role === 'Admin';
  }



  Math = Math;

  navigateToHome(): void {
    this.router.navigate(['/welcome']);
  }

  goToPage(page: number): void {
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
}