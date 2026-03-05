import { Injectable, signal, inject } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  isRead: boolean;
  isDeleted?: boolean; // Para el estado temporal de eliminación
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private hubConnection?: HubConnection;
  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  private deleteTimeout?: any;

  private authService = inject(AuthService);
  private http = inject(HttpClient);

  constructor() {}

  async startConnection(): Promise<void> {
    const token = this.authService.getToken();
    if (!token) return;

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${environment.apiUrl.replace('/api', '')}/notificationHub`, {
        accessTokenFactory: () => token
      })
      .build();

    try {
      await this.hubConnection.start();
      
      this.hubConnection.on('NewNotification', (notification: any) => {
        if (this.shouldShowNotification(notification)) {
          this.addNotification(notification);
        }
      });

      await this.loadExistingNotifications();

    } catch (error) {
      console.error('SignalR Connection Error:', error);
    }
  }

  async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
    }
  }

  private addNotification(notification: Notification): void {
    const current = this.notifications();
    // Verificar si la notificación ya existe
    const exists = current.some(n => n.id === notification.id);
    if (!exists) {
      this.notifications.set([notification, ...current]);
      this.updateUnreadCount();
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      // Actualizar en el backend
      await this.http.put(`${environment.apiUrl}/notifications/${notificationId}/mark-read`, {}).toPromise();
      
      const current = this.notifications();
      const updated = current.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      this.notifications.set(updated);
      this.updateUnreadCount();
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      // Marcar como eliminada temporalmente (mostrar mensaje de deshacer)
      const current = this.notifications();
      const updated = current.map(n => 
        n.id === notificationId ? { ...n, isDeleted: true } : n
      );
      this.notifications.set(updated);
      this.updateUnreadCount();
      
      // Esperar 5 segundos antes de eliminar permanentemente
      if (this.deleteTimeout) {
        clearTimeout(this.deleteTimeout);
      }
      
      this.deleteTimeout = setTimeout(async () => {
        try {
          // Eliminar en el backend (borrado lógico)
          await this.http.delete(`${environment.apiUrl}/notifications/${notificationId}`).toPromise();
          
          // Eliminar de la lista local
          const current = this.notifications();
          const filtered = current.filter(n => n.id !== notificationId);
          this.notifications.set(filtered);
          this.updateUnreadCount();
        } catch (error) {
          console.error('Error eliminando notificación del backend:', error);
        }
      }, 5000);
      
    } catch (error) {
      console.error('Error eliminando notificación:', error);
    }
  }

  undoDelete(notificationId: string): void {
    // Cancelar el timeout de eliminación
    if (this.deleteTimeout) {
      clearTimeout(this.deleteTimeout);
    }
    
    // Restaurar la notificación
    const current = this.notifications();
    const updated = current.map(n => 
      n.id === notificationId ? { ...n, isDeleted: false } : n
    );
    this.notifications.set(updated);
    this.updateUnreadCount();
  }

  clearAll(): void {
    // Eliminar todas las notificaciones del backend
    const current = this.notifications();
    current.forEach(notification => {
      this.http.delete(`${environment.apiUrl}/notifications/${notification.id}`).subscribe({
        error: (error) => console.error('Error eliminando notificación:', error)
      });
    });
    
    // Limpiar la lista local
    this.notifications.set([]);
    this.unreadCount.set(0);
  }

  private updateUnreadCount(): void {
    const unread = this.notifications().filter(n => !n.isRead).length;
    this.unreadCount.set(unread);
  }

  private shouldShowNotification(notification: any): boolean {
    const currentUser = this.authService.currentUser();
    const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'admin';
    
    // Los Admins siempre reciben todas las notificaciones
    if (isAdmin) {
      return true;
    }
    
    // Para Owners, verificar preferencias
    const savedSettings = localStorage.getItem('notificationSettings');
    
    if (!savedSettings) {
      // Si no hay configuración, aplicar valores por defecto
      if (notification.category === 'announcements' || 
          notification.type === 'AnnouncementUrgent' || 
          notification.type === 'AnnouncementNormal' || 
          notification.type === 'AnnouncementDeleted') {
        return false; // Anuncios desactivados por defecto
      }
      if (notification.type === 'PaymentReceived' || 
          notification.type === 'PaymentApproved' || 
          notification.type === 'PaymentRejected') {
        return true; // Pagos activados por defecto
      }
      if (notification.category === 'reminders' || 
          notification.type === 'DebtReminder' || 
          notification.type === 'DebtOverdue') {
        return true; // Recordatorios activados por defecto
      }
      return true; // Otras notificaciones activadas por defecto
    }
    
    const settings = JSON.parse(savedSettings);
    
    // Filtrar notificaciones de anuncios según preferencias (solo para Owners)
    if (notification.category === 'announcements' || 
        notification.type === 'AnnouncementUrgent' || 
        notification.type === 'AnnouncementNormal' || 
        notification.type === 'AnnouncementDeleted') {
      return settings.announcements === true;
    }
    
    // Filtrar notificaciones de pagos según preferencias (solo para Owners)
    if (notification.type === 'PaymentReceived' || 
        notification.type === 'PaymentApproved' || 
        notification.type === 'PaymentRejected') {
      return settings.payments === true;
    }
    
    // Filtrar recordatorios de vencimiento según preferencias (solo para Owners)
    if (notification.category === 'reminders' || 
        notification.type === 'DebtReminder' || 
        notification.type === 'DebtOverdue') {
      return settings.reminders === true;
    }
    
    // Para otros tipos de notificaciones, mostrar siempre
    return true;
  }

  clearAll(): void {
    this.notifications.set([]);
    this.unreadCount.set(0);
  }

  private async loadExistingNotifications(): Promise<void> {
    try {
      const response = await this.http.get<any>(
        `${environment.apiUrl}/notifications`
      ).toPromise();
      
      if (response?.success && response.data) {
        const notifications = response.data;
        
        const filteredNotifications = notifications.filter((notification: any) => 
          this.shouldShowNotification(notification)
        );
        
        this.notifications.set(filteredNotifications);
        this.updateUnreadCount();
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  }
}