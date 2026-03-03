import { ENDPOINTS } from '../config/api.config';
import { Debt } from '../types';
import ApiService from './api.service';

export const DebtService = {
  async getDebtsByOwner(ownerId: string): Promise<Debt[]> {
    return await ApiService.get<Debt[]>(
      ENDPOINTS.DEBTS.GET_BY_OWNER(ownerId)
    );
  },

  async getDebtById(ownerId: string, debtId: string): Promise<Debt> {
    return await ApiService.get<Debt>(
      `${ENDPOINTS.DEBTS.GET_BY_OWNER(ownerId)}/${debtId}`
    );
  },
};
