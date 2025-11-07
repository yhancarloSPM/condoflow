import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="welcome-layout">
      <!-- Top Navigation -->
      <nav class="top-nav">
        <div class="nav-container">
          <div class="brand">
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
                <span class="user-role">{{ isAdmin() ? 'Administrador' : 'Propietario' }}</span>
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
        <div class="welcome-header">
          <h1>¡Hola, {{ currentUser()?.firstName }}!</h1>
          <p>¿Qué necesitas hacer hoy?</p>
        </div>

        <div class="actions-grid">
          @if (isAdmin()) {
            <div class="action-card" (click)="navigateTo('/user-management')">
              <div class="action-icon admin">
                <i class="pi pi-users"></i>
              </div>
              <h3>Gestión de Usuarios</h3>
            </div>
            
            <div class="action-card" (click)="navigateTo('/payment-management')">
              <div class="action-icon payments">
                <i class="pi pi-credit-card"></i>
              </div>
              <h3>Gestión de Pagos</h3>
            </div>
            
            <div class="action-card" (click)="navigateTo('/debt-management')">
              <div class="action-icon debts">
                <i class="pi pi-file"></i>
              </div>
              <h3>Gestión de Deudas</h3>
            </div>
            
            <div class="action-card" (click)="navigateTo('/reports')">
              <div class="action-icon reports">
                <i class="pi pi-file-pdf"></i>
              </div>
              <h3>Reportes</h3>
            </div>
            
            <div class="action-card" (click)="navigateTo('/incident-management')">
              <div class="action-icon maintenance">
                <i class="pi pi-wrench"></i>
              </div>
              <h3>Gestión de Incidencias</h3>
            </div>
            
            <div class="action-card" (click)="navigateTo('/announcement-management')">
              <div class="action-icon announcements">
                <i class="pi pi-bell"></i>
              </div>
              <h3>Gestionar Comunicados</h3>
            </div>
            
            <div class="action-card" (click)="navigateTo('/reservation-management')">
              <div class="action-icon reservations">
                <i class="pi pi-calendar"></i>
              </div>
              <h3>Gestión de Reservas</h3>
            </div>
            
            <div class="action-card" (click)="navigateTo('/dashboard')">
              <div class="action-icon dashboard">
                <i class="pi pi-chart-bar"></i>
              </div>
              <h3>Dashboard</h3>
            </div>
          } @else {
            <div class="action-card" (click)="navigateTo('/my-payments')">
              <div class="action-icon payments">
                <i class="pi pi-credit-card"></i>
              </div>
              <h3>Mis Pagos</h3>
            </div>
            
            <div class="action-card" (click)="navigateTo('/my-debts')">
              <div class="action-icon debts">
                <i class="pi pi-file"></i>
              </div>
              <h3>Mis Deudas</h3>
            </div>
            
            <div class="action-card" (click)="navigateTo('/my-incidents')">
              <div class="action-icon maintenance">
                <i class="pi pi-wrench"></i>
              </div>
              <h3>Reporte de Incidencias</h3>
            </div>
            
            <div class="action-card" (click)="navigateTo('/announcements')">
              <div class="action-icon announcements">
                <i class="pi pi-bell"></i>
              </div>
              <h3>Leer Comunicados</h3>
            </div>
            
            <div class="action-card" (click)="navigateTo('/reservations')">
              <div class="action-icon reservations">
                <i class="pi pi-calendar"></i>
              </div>
              <h3>Reservas de Gazebo</h3>
            </div>
            
            <div class="action-card" (click)="navigateTo('/my-profile')">
              <div class="action-icon profile">
                <i class="pi pi-user"></i>
              </div>
              <h3>Mi Perfil</h3>
            </div>
            
            <div class="action-card" (click)="navigateTo('/owner-dashboard')">
              <div class="action-icon dashboard">
                <i class="pi pi-chart-bar"></i>
              </div>
              <h3>Mi Dashboard</h3>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .welcome-layout {
      min-height: 100vh;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
    }

    /* Top Navigation */
    .top-nav {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .nav-container {
      width: 100%;
      padding: 0 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 4rem;
    }

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

    .user-section {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 0.5rem;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.25rem 0.75rem;
      border-radius: 8px;
      transition: background 0.2s ease;
    }

    .user-info:hover {
      background: rgba(255, 255, 255, 0.5);
    }

    .user-avatar {
      background: linear-gradient(135deg, #10B981, #059669);
      color: white;
      font-weight: 600;
      width: 2.25rem;
      height: 2.25rem;
      font-size: 0.875rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
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
      background: white;
      border: 1px solid #e5e7eb;
      color: #6b7280;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 8px;
      padding: 0;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .logout-button:hover {
      border-color: #fca5a5;
      color: #ef4444;
      background: #fef2f2;
    }

    /* Notifications */
    .notification-section {
      position: relative;
      padding: 0.25rem;
    }

    .notification-button {
      background: transparent;
      border: 1px solid #e5e7eb;
      color: #6b7280;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 6px;
      padding: 0;
      position: relative;
      cursor: pointer;
    }

    .notification-button:hover {
      border-color: #2563EB;
      color: #2563EB;
      background: #eff6ff;
    }

    .notification-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #dc3545;
      color: white;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .notification-panel {
      width: 350px;
      max-height: 450px;
      border-radius: 12px !important;
    }

    .notification-list {
      max-height: 350px;
      overflow-y: auto;
    }

    .notification-item {
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .notification-item:hover {
      background: #f8f9fa !important;
    }

    .notification-item:last-child {
      border-bottom: none !important;
    }

    .notification-unread {
      background: linear-gradient(90deg, #eff6ff 0%, #f0f9ff 100%) !important;
      border-left: 3px solid #2563EB !important;
    }

    .notification-read {
      background: #fafafa !important;
      opacity: 0.8;
    }

    .notification-read:hover {
      opacity: 1 !important;
    }

    /* Main Content */
    .main-content {
      flex: 1;
      max-width: 1200px;
      margin: 0 auto;
      padding: 3rem 2rem;
      text-align: center;
    }

    .welcome-header {
      margin-bottom: 3rem;
    }

    .welcome-header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 0.5rem 0;
    }

    .welcome-header p {
      font-size: 1.125rem;
      color: #6b7280;
      margin: 0;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 2rem;
      max-width: 1000px;
      margin: 0 auto;
    }

    .action-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 3.5rem 1.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }

    .action-card:hover {
      border-color: #2563EB;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
      transform: translateY(-2px);
    }

    .action-icon {
      width: 3rem;
      height: 3rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      color: white;
      margin: 0 auto 1rem auto;
    }

    .action-card h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .action-icon.admin { background: linear-gradient(135deg, #10b981, #059669); }
    .action-icon.payments { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .action-icon.debts { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .action-icon.reports { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
    .action-icon.maintenance { background: linear-gradient(135deg, #f97316, #ea580c); }
    .action-icon.announcements { background: linear-gradient(135deg, #06b6d4, #0891b2); }
    .action-icon.reservations { background: linear-gradient(135deg, #84cc16, #65a30d); }
    .action-icon.dashboard { background: linear-gradient(135deg, #6366f1, #4f46e5); }
    .action-icon.profile { background: linear-gradient(135deg, #ec4899, #db2777); }
    .action-icon.documents { background: linear-gradient(135deg, #14b8a6, #0d9488); }
    .action-icon.contact { background: linear-gradient(135deg, #3b82f6, #2563eb); }

    .contact-card {
      cursor: default !important;
    }

    .contact-card:hover {
      border-color: #e5e7eb !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
      transform: none !important;
    }

    .contact-info {
      margin-top: 1rem;
      text-align: left;
    }

    .contact-info p {
      margin: 0.5rem 0;
      font-size: 0.875rem;
      color: #4b5563;
    }

    .contact-info strong {
      color: #1f2937;
    }

    @media (max-width: 768px) {
      .main-content {
        padding: 2rem 1rem;
      }
      
      .welcome-header h1 {
        font-size: 2rem;
      }
      
      .actions-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
      }
    }

    @media (max-width: 480px) {
      .actions-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .action-card {
        padding: 1.5rem 0.75rem;
      }
    }
  `]
})
export class WelcomeComponent implements OnInit, OnDestroy {
  currentUser = signal<any>(null);

  constructor(
    private authService: AuthService,
    private router: Router,
    public notificationService: NotificationService
  ) {}

  async ngOnInit() {
    this.currentUser.set(this.authService.user());
    await this.notificationService.startConnection();
  }

  async ngOnDestroy() {
    await this.notificationService.stopConnection();
  }

  isAdmin(): boolean {
    const user = this.currentUser();
    return user?.role === 'Admin';
  }

  navigateTo(route: string): void {
    console.log('Navegando a:', route);
    this.router.navigate([route]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.notificationService.markAsRead(notificationId);
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'U';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }
}