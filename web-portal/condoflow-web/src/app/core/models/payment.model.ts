export interface Payment {
  id: string;
  ownerId: string;
  ownerName: string;
  apartment: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: string;
  statusName: string;
  receiptData?: string;
  conceptCode: string;
  conceptName: string;
  createdAt: string;
}

export interface CreatePaymentRequest {
  ownerId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  conceptCode: string;
  receiptData?: string;
}
