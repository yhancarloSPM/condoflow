import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CardModule,
    MessageModule
  ],
  template: `
    <div class="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-md-6 col-lg-4">
            <p-card>
              <ng-template pTemplate="header">
                <div class="text-center p-3">
                  <h2 class="mb-0">CondoFlow</h2>
                  <p class="text-muted">Iniciar Sesión</p>
                </div>
              </ng-template>
              
              <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
                @if (errorMessage()) {
                  <p-message severity="error" [text]="errorMessage()" class="w-100 mb-3"></p-message>
                }
                
                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input 
                    pInputText 
                    id="email" 
                    formControlName="email"
                    class="form-control"
                    placeholder="tu@email.com"
                  />
                  @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
                    <small class="text-danger">Email es requerido</small>
                  }
                </div>
                
                <div class="mb-3">
                  <label for="password" class="form-label">Contraseña</label>
                  <p-password 
                    formControlName="password"
                    [feedback]="false"
                    [toggleMask]="true"
                    placeholder="Tu contraseña"
                    styleClass="w-100"
                  ></p-password>
                  @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
                    <small class="text-danger">Contraseña es requerida</small>
                  }
                </div>
                
                <div class="d-grid gap-2">
                  <p-button 
                    type="submit"
                    label="Iniciar Sesión"
                    [loading]="authService.isLoading()"
                    [disabled]="loginForm.invalid"
                    styleClass="w-100"
                  ></p-button>
                </div>
              </form>
              
              <ng-template pTemplate="footer">
                <div class="text-center">
                  <p class="mb-0">
                    ¿No tienes cuenta? 
                    <a href="/auth/register" class="text-decoration-none">Regístrate</a>
                  </p>
                </div>
              </ng-template>
            </p-card>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  readonly authService = inject(AuthService);
  
  errorMessage = signal<string>('');
  
  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.errorMessage.set('');
      
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/dashboard']);
          } else {
            this.errorMessage.set(response.message || 'Error al iniciar sesión');
          }
        },
        error: (error) => {
          this.errorMessage.set('Error de conexión. Intenta nuevamente.');
        }
      });
    }
  }
}