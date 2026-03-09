export interface Debt {
  id: string;
  ownerId: string;
  ownerName: string;
  apartment: string;
  amount: number;
  month: string;
  year: number;
  dueDate: string;
  status: string;
  createdAt: string;
}

export interface DebtSummary {
  ownerId: string;
  ownerName: string;
  apartment: string;
  totalDebts: number;
  totalAmount: number;
  pendingDebts: number;
  paidDebts: number;
  debts: Debt[];
}

export interface CreateDebtRequest {
  ownerId: string;
  amount: number;
  month: string;
  year: number;
  dueDate: string;
}
