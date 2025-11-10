export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export interface Reservation {
  id: string;
  userName: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  eventTypeCode: string;
  status: ReservationStatus;
  notes?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReservationStatusCounts {
  pending: number;
  confirmed: number;
  rejected: number;
  cancelled: number;
}

export interface ReservationFilters {
  status: string;
  eventType: string;
  searchTerm: string;
}