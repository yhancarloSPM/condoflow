import { ENDPOINTS } from '../config/api.config';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types';
import ApiService from './api.service';
import { StorageService } from './storage.service';

export const AuthService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await ApiService.post<any>(
      ENDPOINTS.AUTH.LOGIN,
      credentials
    );

    // El backend devuelve los datos dentro de response.data
    const userData = response.data;
    const authData = {
      token: userData.token,
      refreshToken: userData.refreshToken,
      userId: userData.user.id,
      ownerId: userData.user.ownerId,
      email: userData.user.email,
      firstName: userData.user.firstName,
      lastName: userData.user.lastName,
      role: userData.user.role,
    };

    // Save tokens and user data
    await StorageService.saveToken(authData.token);
    await StorageService.saveRefreshToken(authData.refreshToken);
    await StorageService.saveUser({
      userId: authData.userId,
      ownerId: authData.ownerId,
      email: authData.email,
      firstName: authData.firstName,
      lastName: authData.lastName,
      role: authData.role,
    });

    return authData;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await ApiService.post<any>(
      ENDPOINTS.AUTH.REGISTER,
      data
    );

    // El backend devuelve los datos dentro de response.data
    const userData = response.data;
    const authData = {
      token: userData.token,
      refreshToken: userData.refreshToken,
      userId: userData.user.id,
      ownerId: userData.user.ownerId,
      email: userData.user.email,
      firstName: userData.user.firstName,
      lastName: userData.user.lastName,
      role: userData.user.role,
    };

    // Save tokens and user data
    await StorageService.saveToken(authData.token);
    await StorageService.saveRefreshToken(authData.refreshToken);
    await StorageService.saveUser({
      userId: authData.userId,
      ownerId: authData.ownerId,
      email: authData.email,
      firstName: authData.firstName,
      lastName: authData.lastName,
      role: authData.role,
    });

    return authData;
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
