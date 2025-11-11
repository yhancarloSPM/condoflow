export enum IncidentStatus {
  REPORTED = 'reported',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected'
}

export enum IncidentPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum IncidentCategory {
  MAINTENANCE = 'maintenance',
  COMMON_AREAS = 'common_areas',
  SECURITY = 'security',
  CLEANING = 'cleaning',
  NOISE = 'noise',
  SUGGESTIONS = 'suggestions'
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  status: IncidentStatus;
  ownerName: string;
  apartment: string;
  createdAt: string;
  updatedAt?: string;
  imageUrl?: string;
  hasImage?: boolean;
  adminComment?: string;
}

export interface IncidentCategoryOption {
  label: string;
  value: IncidentCategory;
}

export interface IncidentPriorityOption {
  label: string;
  value: IncidentPriority;
}

export interface IncidentStatusCounts {
  reported: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  cancelled: number;
}

export interface IncidentFilters {
  status: string;
  priority: string;
  dateFilter: string;
  searchTerm: string;
}

export interface IncidentUpdateData {
  status: IncidentStatus;
  adminComment?: string;
}