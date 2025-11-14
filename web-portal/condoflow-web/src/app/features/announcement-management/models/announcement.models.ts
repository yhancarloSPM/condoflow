export interface Announcement {
  id: string;
  title: string;
  content: string;
  eventDate?: string;
  isUrgent: boolean;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
  announcementTypeId: number;
  announcementTypeName: string;
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

export interface AnnouncementType {
  id: number;
  name: string;
  code: string;
}

export enum AnnouncementTypeFilter {
  ALL = 'all',
  URGENT = 'urgent',
  EVENT = 'event',
  INFO = 'info'
}