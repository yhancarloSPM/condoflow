import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="top-nav">
      <div class="nav-container">
        <div class="brand" (click)="navigateToHome()" style="cursor: pointer !important; z-index: 9999; position: relative;">
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
              <div class="card border-0 notification-card">
                <div class="card-header notification-header border-bottom">
                  <div class="d-flex justify-content-between align-items-center">
                    <h6 class="mb-0 fw-semibold text-white">Notificaciones</h6>
                    <button 
                      type="button" 
                      class="btn-clear-all"
                      (click)="notificationService.clearAll()"
                      title="Limpiar todas las notificaciones">
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                </div>
                <div class="card-body p-0">
                  @if (notificationService.notifications().length === 0) {
                    <div class="text-center py-4">
                      <i class="pi pi-bell-slash text-white" style="font-size: 2rem; opacity: 0.7;"></i>
                      <p class="text-white mb-0 mt-2" style="opacity: 0.8;">No hay notificaciones</p>
                    </div>
                  } @else {
                    <div class="notification-list">
                      @for (notification of notificationService.notifications(); track notification.id) {
                        <div 
                          class="notification-item border-bottom"
                          [class.notification-unread]="!notification.isRead"
                          [class.notification-read]="notification.isRead"
                        >
                          <div class="d-flex align-items-start p-3">
                            <div class="flex-grow-1" (click)="markAsRead(notification.id)" style="cursor: pointer;">
                              <h6 class="mb-1 text-white" [class.fw-bold]="!notification.isRead" [class.fw-normal]="notification.isRead">{{ notification.title }}</h6>
                              <p class="mb-1 small text-white" [style.opacity]="notification.isRead ? '0.7' : '0.9'">{{ notification.message }}</p>
                              <small class="text-white" style="opacity: 0.6;">{{ notification.createdAt | date:'short' }}</small>
                            </div>
                            @if (!notification.isRead) {
                              <div class="d-flex flex-column align-items-center">
                                <span class="badge bg-warning rounded-pill mb-1"></span>
                                <small class="text-warning fw-bold" style="font-size: 0.65rem;">NUEVO</small>
                              </div>
                            } @else {
                              <div class="d-flex flex-column align-items-center gap-1">
                                <span class="badge bg-light rounded-pill mb-1"></span>
                                <small class="text-white fw-normal" style="font-size: 0.65rem; opacity: 0.7;">LEÍDO</small>
                                <button 
                                  class="btn-delete-notification"
                                  (click)="deleteNotification($event, notification.id)"
                                  title="Eliminar notificación"
                                  style="margin-top: 4px;">
                                  <i class="pi pi-trash"></i>
                                </button>
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

          @if (currentUser()) {
            <div class="user-info">
              <div class="user-avatar">
                {{ getUserInitials() }}
              </div>
              <div class="user-details">
                <span class="user-name">{{ currentUser()?.firstName }} {{ currentUser()?.lastName }}</span>
                <span class="user-info-line">
                  <span class="user-role">{{ isAdmin() ? 'Administrador' : 'Propietario' }}</span>
                  <span class="separator"> | </span>
                  <span class="user-apartment">{{ currentUser()?.apartment || 'Sin apartamento' }}</span>
                </span>
              </div>
            </div>
            <button 
              type="button" 
              class="logout-button"
              (click)="logout()"
              title="Cerrar Sesión">
              <i class="pi pi-sign-out"></i>
            </button>
          }
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .top-nav { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); border-bottom: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); }
    .nav-container { width: 100%; padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; height: 4rem; }
    .brand { display: flex; align-items: center; gap: 0.75rem; transition: all 0.2s ease; cursor: pointer !important; z-index: 9999; position: relative; user-select: none; }
    .brand:hover { opacity: 0.8; transform: translateY(-1px); }
    .brand-icon { width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; }
    .brand-name { font-size: 1.5rem; font-weight: 700; color: white; }
    .user-section { display: flex; align-items: center; gap: 1.5rem; }
    .user-info { display: flex; align-items: center; gap: 0.75rem; padding: 0.25rem 0.75rem; border-radius: 8px; transition: background 0.2s ease; }
    .user-avatar { background: linear-gradient(135deg, #10B981, #059669); color: white; font-weight: 600; width: 2.25rem; height: 2.25rem; font-size: 0.875rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .user-details { display: flex; flex-direction: column; }
    .user-name { font-weight: 600; color: white; font-size: 0.875rem; }
    .user-info-line { display: flex; align-items: center; gap: 0; }
    .user-apartment { font-size: 0.75rem; color: rgba(255, 255, 255, 0.9); font-weight: 600; text-transform: uppercase; }
    .separator { font-size: 0.75rem; color: rgba(255, 255, 255, 0.6); margin: 0 0.25rem; }
    .user-role { font-size: 0.75rem; color: rgba(255, 255, 255, 0.8); }
    .logout-button { background: transparent; border: none; color: white; width: 2.5rem; height: 2.5rem; padding: 0; cursor: pointer; transition: all 0.2s ease; }
    .logout-button:hover { color: rgba(255, 255, 255, 0.8); }
    
    .notification-section { position: relative; padding: 0.25rem; }
    .notification-button { background: transparent; border: none; color: white; width: 2.25rem; height: 2.25rem; padding: 0; position: relative; cursor: pointer; }
    .notification-button:hover { color: rgba(255, 255, 255, 0.8); }
    .notification-badge { position: absolute; top: -8px; right: -8px; background: #dc3545; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; display: flex; align-items: center; justify-content: center; }
    .notification-panel { width: 350px; max-height: 450px; border-radius: 12px !important; z-index: 9999 !important; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%) !important; }
    .notification-card { background: transparent !important; }
    .notification-header { background: transparent !important; border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important; }
    .notification-list { max-height: 350px; overflow-y: auto; }
    .notification-item { transition: all 0.2s ease; border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important; }
    .notification-item:hover { background: rgba(255, 255, 255, 0.1) !important; }
    .notification-item:last-child { border-bottom: none !important; }
    .notification-unread { background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.1)) !important; border-left: 3px solid #fbbf24 !important; }
    .notification-read { background: rgba(255, 255, 255, 0.05) !important; opacity: 0.9; }
    .notification-read:hover { opacity: 1 !important; background: rgba(255, 255, 255, 0.12) !important; }
    .btn-clear-all { background: transparent; border: none; color: #ef4444; padding: 0.25rem 0.5rem; cursor: pointer; transition: all 0.2s ease; border-radius: 4px; font-size: 1rem; }
    .btn-clear-all:hover { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .btn-delete-notification { background: transparent; border: none; color: #ef4444; padding: 0.25rem 0.5rem; cursor: pointer; transition: all 0.2s ease; border-radius: 4px; font-size: 0.875rem; }
    .btn-delete-notification:hover { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentUser = signal<any>(null);

  constructor(
    private authService: AuthService,
    private router: Router,
    public notificationService: NotificationService
  ) {
    this.currentUser.set(this.authService.user());
  }

  async ngOnInit() {
    await this.notificationService.startConnection();
  }

  async ngOnDestroy() {
    await this.notificationService.stopConnection();
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.notificationService.markAsRead(notificationId);
  }

  async deleteNotification(event: Event, notificationId: string): Promise<void> {
    event.stopPropagation(); // Evitar que se marque como leída al hacer clic en eliminar
    await this.notificationService.deleteNotification(notificationId);
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'Admin';
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
}