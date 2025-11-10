export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  block?: string;
  apartment?: string;
  isApproved: boolean;
  isRejected: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UserStatusCounts {
  pending: number;
  approved: number;
  rejected: number;
}

export interface UserFilters {
  status: string;
  searchTerm: string;
}