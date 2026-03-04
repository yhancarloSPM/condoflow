import { ENDPOINTS } from '../config/api.config';
import { Debt } from '../types';
import ApiService from './api.service';

export const DebtService = {
  async getDebtsByOwner(ownerId: string): Promise<Debt[]> {
    const response = await ApiService.get<any>(
      ENDPOINTS.DEBTS.GET_BY_OWNER(ownerId)
    );
    
    // El backend devuelve los datos agrupados, necesitamos combinarlos
    const data = response.data;
    const allDebts = [
      ...(data.currentDebts || []),
      ...(data.overdueDebts || []),
      ...(data.paymentSubmittedDebts || []),
      ...(data.paidDebts || []),
    ];
    
    return allDebts;
  },

  async getDebtById(ownerId: string, debtId: string): Promise<Debt> {
    return await ApiService.get<Debt>(
      `${ENDPOINTS.DEBTS.GET_BY_OWNER(ownerId)}/${debtId}`
    );
  },
};
