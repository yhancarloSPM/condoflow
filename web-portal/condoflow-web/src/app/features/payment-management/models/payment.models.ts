import { PaymentStatus, PaymentAction } from '../../../shared/enums/payment-status.enum';

export interface Payment {
  id: string;
  ownerName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentDate: Date;
  createdAt: Date;
  status: PaymentStatus;
  receiptUrl?: string;
  concept?: string;
  rejectionReason?: string;
  processedAt?: Date;
}

export interface PaymentFilters {
  searchTerm: string;
  statusFilter: string;
  sortBy: string;
}

export interface PaymentStatusCounts {
  pending: number;
  approved: number;
  rejected: number;
}

export interface PaymentUpdateData {
  action: PaymentAction;
  rejectionReason?: string;
}