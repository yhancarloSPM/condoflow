export interface Incident {
  id: string;
  ownerId: string;
  ownerName: string;
  apartment: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  imageData?: string;
  adminComment?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateIncidentDto {
  title: string;
  description: string;
  category: string;
  priority: string;
  imageData?: string;
}

export interface UpdateIncidentStatusDto {
  status: string;
  adminComment?: string;
}

export interface CancelIncidentDto {
  comment: string;
}
