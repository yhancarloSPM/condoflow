export interface AnnouncementDto {
  id: number;
  title: string;
  content: string;
  isUrgent: boolean;
  eventDate?: string;
  typeName: string;
  typeId?: number;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  isUrgent: boolean;
  eventDate?: string;
  typeId?: number;
}

export interface UpdateAnnouncementDto {
  title: string;
  content: string;
  isUrgent: boolean;
  eventDate?: string;
  typeId?: number;
}
