import { ENDPOINTS } from '../config/api.config';
import ApiService from './api.service';

export const ApartmentService = {
  async getApartmentById(apartmentId: number): Promise<any> {
    console.log('ApartmentService: Fetching apartment with ID:', apartmentId);
    console.log('ApartmentService: Full URL:', `${ENDPOINTS.APARTMENTS}/${apartmentId}`);
    
    try {
      const response = await ApiService.get<any>(
        `${ENDPOINTS.APARTMENTS}/${apartmentId}`
      );
      console.log('ApartmentService: Raw response:', response);
      console.log('ApartmentService: Response data:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('ApartmentService: Error fetching apartment:', error);
      console.error('ApartmentService: Error response:', error.response?.data);
      console.error('ApartmentService: Error status:', error.response?.status);
      throw error;
    }
  },
};
