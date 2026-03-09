export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  targetRole: string;
  targetUserId?: string;
  relatedEntityId?: string;
  isRead: boolean;
  createdAt: string;
}
