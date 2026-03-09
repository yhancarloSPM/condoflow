export interface Reservation {
  id: string;
  userId: string;
  userName: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  eventTypeCode: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateReservationDto {
  reservationDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
  eventTypeCode: string;
}

export interface ReservationSlot {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export enum ReservationStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled'
}
