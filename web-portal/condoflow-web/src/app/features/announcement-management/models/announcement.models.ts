export interface Announcement {
  id: string;
  title: string;
  content: string;
  eventDate?: string;
  isUrgent: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  eventDate?: string;
  isUrgent: boolean;
}

export interface AnnouncementFilters {
  type: string;
  dateFilter: string;
  searchTerm: string;
}

export enum AnnouncementType {
  ALL = 'all',
  URGENT = 'urgent',
  EVENT = 'event',
  INFO = 'info'
}