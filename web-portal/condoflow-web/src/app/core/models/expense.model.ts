export interface Expense {
  id: number;
  description: string;
  amount: number;
  expenseDate: string;
  categoryName: string;
  providerName: string;
  statusName: string;
  invoiceUrl?: string;
  createdAt: string;
}

export interface CreateExpenseDto {
  description: string;
  amount: number;
  expenseDate: string;
  categoryId: number;
  providerId: number;
  statusId: number;
  invoiceUrl?: string;
}
