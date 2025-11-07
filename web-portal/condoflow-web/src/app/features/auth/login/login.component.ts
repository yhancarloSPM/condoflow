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
    .floating-label {
      position: relative;
      margin-bottom: 2rem;
    }

    .floating-input {
      padding: 1.25rem 0.75rem 0.75rem 0.75rem !important;
      font-size: 1rem !important;
    }

    .floating-label-text {
      position: absolute;
      top: 1.25rem;
      left: 0.75rem;
      font-size: 1rem;
      color: #6c757d;
      pointer-events: none;
      transition: all 0.2s ease-in-out;
      background: white;
      padding: 0 0.25rem;
      z-index: 1;
    }

    .floating-input:focus + .floating-label-text,
    .floating-input:not(:placeholder-shown) + .floating-label-text {
      top: -0.5rem;
      left: 0.5rem;
      font-size: 1rem;
      color: #0d6efd;
      font-weight: 500;
    }

    .floating-input:focus {
      border-color: #0d6efd !important;
      box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25) !important;
    }

    /* Cursor pointer para botones */
    button, .btn, [pButton] {
      cursor: pointer !important;
    }

    a {
      cursor: pointer !important;
    }

    /* Ajuste para p-password con selectores más específicos */
    :host ::ng-deep .floating-label .p-password .p-inputtext {
      padding-right: 3.5rem !important;
      padding-left: 0.75rem !important;
      padding-top: 1.25rem !important;
      padding-bottom: 0.75rem !important;
      font-size: 1.1rem !important;
    }

    :host ::ng-deep .floating-label .p-password .p-password-toggle {
      right: 1rem !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      position: absolute !important;
      z-index: 100 !important;
      width: 1.5rem !important;
      height: 1.5rem !important;
    }

    :host ::ng-deep .floating-label .p-password {
      position: relative !important;
      width: 100% !important;
      display: block !important;
    }

    .floating-label .p-password + .floating-label-text {
      top: 1.25rem;
      left: 0.75rem;
      font-size: 1.1rem;
    }

    .floating-label .p-password .p-inputtext:focus + .floating-label-text,
    .floating-label .p-password .p-inputtext:not(:placeholder-shown) + .floating-label-text {
      top: -0.5rem;
      left: 0.5rem;
      font-size: 0.85rem;
      color: #0d6efd;
      font-weight: 500;
    }

    :host ::ng-deep .p-password .p-password-toggle {
      cursor: pointer !important;
    }
  `],
  template: `
    <div class="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div class="row w-100 justify-content-center">
        <div class="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-4">
          
          <div class="card shadow-lg border-0">
            <div class="card-header bg-primary text-white text-center py-4">
              <h3 class="mb-1 fw-bold">Iniciar Sesión</h3>
              <p class="mb-0 opacity-75">Bienvenido a CondoFlow</p>
            </div>
            
            <div class="card-body p-4">
              <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
                
                <div class="mb-3 floating-label">
                  <input 
                    pInputText 
                    formControlName="email"
                    placeholder=" "
                    class="form-control floating-input"
                    type="email"
                    id="email"
                  />
                  <label for="email" class="floating-label-text">Correo electrónico</label>
                </div>
                
                <div class="mb-4 floating-label">
                  <input 
                    pInputText 
                    formControlName="password"
                    placeholder=" "
                    class="form-control floating-input"
                    type="password"
                    id="password"
                  />
                  <label for="password" class="floating-label-text">Contraseña</label>
                </div>

                @if (errorMessage()) {
                  <div class="alert alert-danger mb-3" role="alert">
                    <small>{{ errorMessage() }}</small>
                  </div>
                }

                <div class="d-grid">
                  <button 
                    pButton 
                    type="submit" 
                    label="Iniciar Sesión"
                    class="btn-lg"
                    [loading]="authService.isLoading()"
                    [disabled]="loginForm.invalid"
                  ></button>
                </div>
              </form>
            </div>
            
            <div class="card-footer text-center bg-light py-3">
              <small class="text-muted">
                ¿No tienes cuenta? 
                <a routerLink="/register" class="text-decoration-none fw-semibold">
                  Crear cuenta
                </a>
              </small>
            </div>
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