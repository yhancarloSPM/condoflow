import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthService } from '../services/auth.service';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types';

interface AuthContextData {
  user: any | null;
  loading: boolean;
  signIn: (credentials: LoginRequest) => Promise<void>;
  signUp: (data: RegisterRequest) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  async function loadStoredUser() {
    try {
      const storedUser = await AuthService.getCurrentUser();
      if (storedUser) {
        setUser(storedUser);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(credentials: LoginRequest) {
    const response = await AuthService.login(credentials);
    
    // Validar que no sea un administrador
    if (response.role === 'Admin') {
      const error: any = new Error('La app móvil es solo para propietarios. Por favor usa la versión web para funciones administrativas.');
      error.isAdminError = true;
      throw error;
    }
    
    setUser({
      userId: response.userId,
      ownerId: response.ownerId,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role,
      apartment: response.apartment,
      apartmentId: response.apartmentId,
    });
  }

  async function signUp(data: RegisterRequest) {
    try {
      const response = await AuthService.register(data);
      setUser({
        userId: response.userId,
        ownerId: response.ownerId,
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
        role: response.role,
      });
    } catch (error) {
      throw error;
    }
  }

  async function signOut() {
    await AuthService.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
