import { ENDPOINTS } from '../config/api.config';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types';
import ApiService from './api.service';
import { StorageService } from './storage.service';

export const AuthService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await ApiService.post<AuthResponse>(
      ENDPOINTS.AUTH.LOGIN,
      credentials
    );

    // Save tokens and user data
    await StorageService.saveToken(response.token);
    await StorageService.saveRefreshToken(response.refreshToken);
    await StorageService.saveUser({
      userId: response.userId,
      ownerId: response.ownerId,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role,
    });

    return response;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await ApiService.post<AuthResponse>(
      ENDPOINTS.AUTH.REGISTER,
      data
    );

    // Save tokens and user data
    await StorageService.saveToken(response.token);
    await StorageService.saveRefreshToken(response.refreshToken);
    await StorageService.saveUser({
      userId: response.userId,
      ownerId: response.ownerId,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role,
    });

    return response;
  },

  async logout(): Promise<void> {
    await StorageService.clearAll();
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await StorageService.getToken();
    return !!token;
  },

  async getCurrentUser(): Promise<any> {
    return await StorageService.getUser();
  },
};
