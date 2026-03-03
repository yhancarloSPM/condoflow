// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  apartmentId: number;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  userId: string;
  ownerId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

// Debt Types
export interface Debt {
  id: string;
  ownerId: string;
  amount: number;
  dueDate: string;
  month: number;
  year: number;
  status: string;
  amountPaid: number;
  remainingAmount: number;
  createdAt: string;
}

// Payment Types
export interface Payment {
  id: string;
  debtId: string;
  ownerId: string;
  amount: number;
  paymentDate: string;
  receiptUrl: string;
  status: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export interface CreatePaymentRequest {
  debtId: string;
  amount: number;
  paymentDate: string;
  receiptBase64: string;
  receiptFileName: string;
}

// User Types
export interface User {
  id: string;
  ownerId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  apartmentId: number;
  role: string;
}
