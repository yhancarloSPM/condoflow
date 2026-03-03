import { ENDPOINTS } from '../config/api.config';
import { Payment, CreatePaymentRequest } from '../types';
import ApiService from './api.service';

export const PaymentService = {
  async getPaymentsByOwner(ownerId: string): Promise<Payment[]> {
    return await ApiService.get<Payment[]>(
      ENDPOINTS.PAYMENTS.GET_BY_OWNER(ownerId)
    );
  },

  async createPayment(
    ownerId: string,
    payment: CreatePaymentRequest
  ): Promise<Payment> {
    return await ApiService.post<Payment>(
      ENDPOINTS.PAYMENTS.CREATE(ownerId),
      payment
    );
  },
};
