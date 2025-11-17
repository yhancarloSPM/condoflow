import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    RouterLink
  ],
  styles: [`
    .auth-layout {
      min-height: 100vh;
      display: flex;
    }

    .auth-left {
      flex: 1;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      position: relative;
      overflow: hidden;
    }

    .auth-left::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: float 6s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(180deg); }
    }

    .brand-section {
      text-align: center;
      z-index: 1;
    }

    .brand-icon {
      width: 5rem;
      height: 5rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 2rem;
      color: white;
      font-size: 2.5rem;
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255, 255, 255, 0.3);
    }

    .brand-title {
      font-size: 3rem;
      font-weight: 800;
      color: white;
      margin: 0 0 1rem 0;
      text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      letter-spacing: -0.02em;
    }

    .brand-subtitle {
      font-size: 1.25rem;
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 3rem 0;
      font-weight: 300;
    }

    .brand-features {
      display: grid;
      gap: 1rem;
      max-width: 300px;
      margin: 0 auto;
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 1rem;
      color: white;
      font-size: 1.1rem;
      font-weight: 500;
    }

    .feature i {
      color: #10b981;
      font-size: 1.25rem;
    }

    .auth-right {
      flex: 1;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      position: relative;
    }

    .auth-right::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
      z-index: 0;
    }

    .auth-form {
      width: 100%;
      max-width: 400px;
      position: relative;
      z-index: 1;
    }

    .form-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .form-header h2 {
      font-size: 2rem;
      font-weight: 700;
      color: #1e3c72;
      margin: 0 0 0.5rem 0;
    }

    .form-header p {
      color: #6b7280;
      font-size: 1rem;
      margin: 0;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      color: #374151;
      font-weight: 600;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      font-size: 0.875rem;
    }

    .form-control {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s ease;
      background: #f9fafb;
    }

    .form-control:focus {
      outline: none;
      border-color: #1e3c72;
      background: white;
      box-shadow: 0 0 0 3px rgba(30, 60, 114, 0.1);
    }

    .form-control.is-invalid {
      border-color: #dc2626;
      background: #fef2f2;
    }



    .form-control::placeholder {
      color: #9ca3af;
    }

    .btn {
      width: 100%;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      transition: all 0.3s ease;
      border: none;
      cursor: pointer;
      margin-top: 1rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      transform: none;
      box-shadow: none;
    }

    .error-message {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 0.875rem 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
    }

    .field-error {
      color: #dc2626;
      font-size: 0.75rem;
      margin-top: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }



    .form-footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #e5e7eb;
    }

    .form-footer p {
      color: #6b7280;
      margin: 0;
      font-size: 0.875rem;
    }

    .auth-link {
      color: #1e3c72;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s ease;
    }

    .auth-link:hover {
      color: #2a5298;
      text-decoration: underline;
    }
  `],
  template: `
    <div class="auth-layout">
      <div class="auth-left">
        <div class="brand-section">
          <div class="brand-icon">
            <i class="pi pi-home"></i>
          </div>
          <h1 class="brand-title">CondoFlow</h1>
          <p class="brand-subtitle">Sistema de Gestión de Condominios</p>
          <div class="brand-features">
            <div class="feature">
              <i class="pi pi-users"></i>
              <span>Usuarios</span>
            </div>
            <div class="feature">
              <i class="pi pi-money-bill"></i>
              <span>Deudas</span>
            </div>
            <div class="feature">
              <i class="pi pi-credit-card"></i>
              <span>Pagos</span>
            </div>
            <div class="feature">
              <i class="pi pi-megaphone"></i>
              <span>Comunicados</span>
            </div>
            <div class="feature">
              <i class="pi pi-wrench"></i>
              <span>Incidencias</span>
            </div>
            <div class="feature">
              <i class="pi pi-calendar"></i>
              <span>Reservas</span>
            </div>
            <div class="feature">
              <i class="pi pi-file-pdf"></i>
              <span>Reportes</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="auth-right">
        <div class="auth-form">
          <div class="form-header">
            <div style="width: 60px; height: 60px; margin: 0 auto 1.5rem; background: linear-gradient(135deg, #1e3c72, #2a5298); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem;">
              <i [class]="showPassword() ? 'pi pi-eye-slash' : 'pi pi-lock'"></i>
            </div>
            <h2>CondoFlow</h2>
            <p>{{ showPassword() ? 'Contraseña visible' : 'Accede a tu cuenta' }}</p>
          </div>
          
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label">
                <i class="pi pi-envelope me-2"></i>
                Correo Electrónico
              </label>
              <input 
                formControlName="email"
                type="email"
                class="form-control"
                [class.is-invalid]="isFieldInvalid('email')"

                placeholder="tu@email.com"
              />
              @if (isFieldInvalid('email')) {
                <div class="field-error">
                  <i class="pi pi-exclamation-circle"></i>
                  @if (loginForm.get('email')?.errors?.['required']) {
                    El correo electrónico es requerido
                  }
                  @if (loginForm.get('email')?.errors?.['email']) {
                    Ingresa un correo electrónico válido
                  }
                </div>
              }

            </div>
            
            <div class="form-group">
              <label class="form-label">
                <i class="pi pi-lock me-2"></i>
                Contraseña
              </label>
              <div style="position: relative;">
                <input 
                  formControlName="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  class="form-control"
                  [class.is-invalid]="isFieldInvalid('password')"
  
                  placeholder="Tu contraseña"
                  style="padding-right: 3rem;"
                />
                <button 
                  type="button"
                  (click)="togglePassword()"
                  style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); border: none; background: none; color: #6c757d; cursor: pointer;"
                >
                  <i [class]="showPassword() ? 'pi pi-eye-slash' : 'pi pi-eye'" style="font-size: 1.1rem;"></i>
                </button>
              </div>
              @if (isFieldInvalid('password')) {
                <div class="field-error">
                  <i class="pi pi-exclamation-circle"></i>
                  La contraseña es requerida
                </div>
              }

            </div>

            @if (errorMessage()) {
              <div class="error-message">
                <i class="pi pi-exclamation-triangle me-2"></i>
                {{ errorMessage() }}
              </div>
            }

            <button 
              type="submit" 
              class="btn btn-primary"
              [disabled]="loginForm.invalid || authService.isLoading()"
            >
              @if (authService.isLoading()) {
                <span class="spinner-border spinner-border-sm me-2"></span>
                Iniciando...
              } @else {
                <i class="pi pi-sign-in me-2"></i>
                Iniciar Sesión
              }
            </button>
          </form>
          
          <div class="form-footer">
            <p>
              ¿No tienes cuenta? 
              <a routerLink="/register" class="auth-link">
                Crear cuenta aquí
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isFieldValid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.valid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.errorMessage.set('');
      
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          if (response?.success) {
            // Esperar un tick para que se actualice el estado
            this.router.navigate(['/welcome']);
          } else {
            this.errorMessage.set(response?.message || 'Error al iniciar sesión');
          }
        },
        error: (error) => {
          console.error('Login error:', error);
          if (error.status === 0) {
            this.errorMessage.set('No se puede conectar al servidor. Verifica que el sistema esté disponible.');
          } else if (error.status >= 500) {
            this.errorMessage.set('Error del servidor. Intenta nuevamente en unos minutos.');
          } else {
            this.errorMessage.set(error.error?.message || 'Error al iniciar sesión. Verifica tus credenciales.');
          }
        }
      });
    }
  }
}