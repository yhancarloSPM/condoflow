import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  block: string;
  apartment: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    refreshToken: string;
    user: User;
  };
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  block?: string;
  apartment?: string;
  ownerId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // Signals para el estado de autenticación
  private _user = signal<User | null>(null);
  private _token = signal<string | null>(null);
  private _refreshToken = signal<string | null>(null);
  private _isLoading = signal<boolean>(false);

  // Computed signals
  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());
  readonly isAdmin = computed(() => this._user()?.role === 'Admin');
  readonly isOwner = computed(() => this._user()?.role === 'Owner');
  
  // Métodos públicos para acceder a los computed signals
  getUserRole(): string | undefined {
    return this._user()?.role;
  }
  
  checkIsAdmin(): boolean {
    return this.isAdmin();
  }
  
  checkIsOwner(): boolean {
    return this.isOwner();
  }
  readonly fullName = computed(() => {
    const user = this._user();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  private readonly apiUrl = environment.apiUrl;

  constructor() {
    this.loadStoredAuth();
  }

  login(credentials: LoginRequest): Observable<any> {
    this._isLoading.set(true);
    
    return this.http.post<any>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setAuthData(response.data.token, response.data.refreshToken, response.data.user);
          }
        }),
        catchError(error => {
          console.error('Login error:', error);
          return of(error.error);
        }),
        tap(() => this._isLoading.set(false))
      );
  }

  register(userData: RegisterRequest): Observable<any> {
    this._isLoading.set(true);
    
    return this.http.post<any>(`${this.apiUrl}/auth/register`, userData)
      .pipe(
        catchError(error => {
          console.error('Register error:', error);
          return of(error.error);
        }),
        tap(() => this._isLoading.set(false))
      );
  }

  logout(): void {
    this.clearAuthData();
    this.router.navigate(['/auth/login']);
  }

  private setAuthData(token: string, refreshToken: string, user: User): void {
    this._token.set(token);
    this._refreshToken.set(refreshToken);
    this._user.set(user);
    
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
  }

  private clearAuthData(): void {
    this._token.set(null);
    this._refreshToken.set(null);
    this._user.set(null);
    
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');
    
    if (token && refreshToken && userStr && userStr !== 'undefined') {
      try {
        const user = JSON.parse(userStr);
        this._token.set(token);
        this._refreshToken.set(refreshToken);
        this._user.set(user);
      } catch (error) {
        console.error('Error loading stored auth:', error);
        this.clearAuthData();
      }
    } else {
      // Si hay datos corruptos, limpiar todo
      this.clearAuthData();
    }
  }

  // Métodos de compatibilidad
  currentUser(): User | null {
    return this._user();
  }

  getToken(): string | null {
    return this._token();
  }

  updateCurrentUser(user: User): void {
    this._user.set(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  getApiUrl(): string {
    return this.apiUrl;
  }

  refreshAuthToken(): Observable<any> {
    const refreshToken = this._refreshToken();
    if (!refreshToken) {
      return of({ success: false, message: 'No refresh token available' });
    }

    return this.http.post<any>(`${this.apiUrl}/auth/refresh-token`, { refreshToken })
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setAuthData(response.data.token, response.data.refreshToken, response.data.user);
          }
        }),
        catchError(error => {
          console.error('Token refresh error:', error);
          this.logout();
          return of({ success: false, message: 'Token refresh failed' });
        })
      );
  }

  getRefreshToken(): string | null {
    return this._refreshToken();
  }
}