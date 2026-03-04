import { ENDPOINTS } from '../config/api.config';
import { Payment, CreatePaymentRequest } from '../types';
import ApiService from './api.service';

export const PaymentService = {
  async getPaymentsByOwner(ownerId: string): Promise<Payment[]> {
    const response = await ApiService.get<any>(
      ENDPOINTS.PAYMENTS.GET_BY_OWNER(ownerId)
    );
    // El backend devuelve los datos dentro de response.data
    return response.data || [];
  },

  async createPayment(
    ownerId: string,
    payment: CreatePaymentRequest
  ): Promise<Payment> {
    const response = await ApiService.post<any>(
      ENDPOINTS.PAYMENTS.CREATE(ownerId),
      payment
    );
    return response.data;
  },
};
