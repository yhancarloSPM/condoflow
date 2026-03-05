import { ENDPOINTS } from '../config/api.config';
import ApiService from './api.service';

export const ApartmentService = {
  async getApartmentById(apartmentId: number): Promise<any> {
    try {
      const response = await ApiService.get<any>(
        `${ENDPOINTS.APARTMENTS}/${apartmentId}`
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};
