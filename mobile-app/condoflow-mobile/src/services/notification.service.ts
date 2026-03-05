import { ENDPOINTS } from '../config/api.config';
import ApiService from './api.service';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const NotificationService = {
  async getNotifications(): Promise<Notification[]> {
    const response = await ApiService.get<any>('/notifications');
    return response.data || [];
  },

  async markAsRead(notificationId: string): Promise<void> {
    await ApiService.put<any>(
      `/notifications/${notificationId}/mark-read`,
      {}
    );
  },

  async markAllAsRead(): Promise<void> {
    // Este endpoint no existe en el backend, por ahora no lo usamos
  },

  async deleteNotification(notificationId: string): Promise<void> {
    await ApiService.delete<any>(`/notifications/${notificationId}`);
  },
};
