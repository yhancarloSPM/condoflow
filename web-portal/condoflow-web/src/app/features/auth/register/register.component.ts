import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
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
      margin-bottom: 1rem;
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

    .form-label {
      font-weight: normal !important;
    }
  `],
  template: `
    <div class="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div class="row w-100 justify-content-center">
        <div class="col-12 col-sm-10 col-md-8 col-lg-7 col-xl-6">
          
          <div class="card shadow-lg border-0">
            <div class="card-header bg-primary text-white text-center py-4">
              <h3 class="mb-1 fw-bold">Crear Cuenta</h3>
              <p class="mb-0 opacity-75">Únete a CondoFlow</p>
            </div>
            
            <div class="card-body p-4">
              <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
                
                <!-- Información Personal -->
                <div class="row g-3 mb-3">
                  <div class="col-6">
                    <div class="floating-label">
                      <input 
                        pInputText 
                        formControlName="firstName"
                        placeholder=" "
                        class="form-control floating-input"
                        id="firstName"
                      />
                      <label for="firstName" class="floating-label-text">Nombre *</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="floating-label">
                      <input 
                        pInputText 
                        formControlName="lastName"
                        placeholder=" "
                        class="form-control floating-input"
                        id="lastName"
                      />
                      <label for="lastName" class="floating-label-text">Apellido *</label>
                    </div>
                  </div>
                </div>
                
                <!-- Contacto -->
                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <div class="floating-label">
                      <input 
                        pInputText 
                        formControlName="email"
                        placeholder=" "
                        class="form-control floating-input"
                        type="email"
                        id="email"
                      />
                      <label for="email" class="floating-label-text">Correo Electrónico *</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="floating-label">
                      <input 
                        pInputText 
                        formControlName="phoneNumber"
                        placeholder=" "
                        class="form-control floating-input"
                        (input)="formatPhoneNumber($event)"
                        maxlength="12"
                        id="phoneNumber"
                      />
                      <label for="phoneNumber" class="floating-label-text">Teléfono *</label>
                    </div>
                  </div>
                </div>
                
                <!-- Seguridad -->
                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <div class="floating-label">
                      <input 
                        pInputText 
                        formControlName="password"
                        placeholder=" "
                        class="form-control floating-input"
                        type="password"
                        id="password"
                      />
                      <label for="password" class="floating-label-text">Contraseña *</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="floating-label">
                      <input 
                        pInputText 
                        formControlName="confirmPassword"
                        placeholder=" "
                        class="form-control floating-input"
                        type="password"
                        id="confirmPassword"
                      />
                      <label for="confirmPassword" class="floating-label-text">Confirmar Contraseña *</label>
                    </div>
                  </div>
                </div>

                <!-- Ubicación -->
                <div class="row g-3 mb-4">
                  <div class="col-md-6">
                    <label class="form-label">Bloque/Torre *</label>
                    <select 
                      formControlName="block"
                      class="form-select"
                      (change)="onBlockChange($event)"
                    >
                      <option value="">-- Seleccionar bloque --</option>
                      @for (block of blocks(); track block.name) {
                        <option [value]="block.name">{{ block.name }}</option>
                      }
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Apartamento *</label>
                    <select 
                      formControlName="apartment"
                      class="form-select"
                    >
                      <option value="">-- Seleccionar apartamento --</option>
                      @for (apt of apartments(); track apt.number) {
                        <option [value]="apt.number">{{ apt.number }}</option>
                      }
                    </select>
                  </div>
                </div>

                @if (errorMessage()) {
                  <div class="alert alert-danger mb-3" role="alert">
                    <small>{{ errorMessage() }}</small>
                  </div>
                }

                @if (successMessage()) {
                  <div class="alert alert-success mb-3" role="alert">
                    <small>{{ successMessage() }}</small>
                  </div>
                }

                <div class="d-grid">
                  <button 
                    pButton 
                    type="submit" 
                    label="Crear Cuenta"
                    class="btn-lg"
                    [loading]="loading()"
                    [disabled]="registerForm.invalid"
                  ></button>
                </div>
              </form>
            </div>
            
            <div class="card-footer text-center bg-light py-3">
              <small class="text-muted">
                ¿Ya tienes cuenta? 
                <a routerLink="/login" class="text-decoration-none fw-semibold">
                  Iniciar sesión
                </a>
              </small>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  blocks = signal<any[]>([]);
  apartments = signal<any[]>([]);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{3}-\d{3}-\d{4}$/)]],
      block: ['', Validators.required],
      apartment: [{value: '', disabled: true}, Validators.required],
      role: ['Owner'],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
    
    this.loadBlocks();
  }

  loadBlocks(): void {
    this.http.get<any>(`${this.authService.getApiUrl()}/blocks`).subscribe({
      next: (response) => {
        if (response.success) {
          const blocksData = response.data.map((block: any) => ({
            name: block.name,
            label: block.name
          }));
          this.blocks.set(blocksData);
        }
      },
      error: () => {
        this.blocks.set([
          { name: 'Q', label: 'Q' },
          { name: 'P', label: 'P' },
          { name: 'N', label: 'N' },
          { name: 'M', label: 'M' },
          { name: 'O', label: 'O' }
        ]);
      }
    });
  }

  onBlockChange(event: any): void {
    const blockName = event.target.value;
    
    if (blockName) {
      this.registerForm.get('apartment')?.enable();
      this.http.get<any>(`${this.authService.getApiUrl()}/apartments/by-block/${blockName}`).subscribe({
        next: (response) => {
          if (response.success) {
            const apartmentsData = response.data.map((apt: any) => ({
              number: apt.number,
              label: apt.number
            }));
            this.apartments.set(apartmentsData);
          }
        },
        error: () => {
          this.apartments.set([]);
        }
      });
    } else {
      this.apartments.set([]);
      this.registerForm.get('apartment')?.disable();
    }
    this.registerForm.patchValue({ apartment: '' });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    return password?.value === confirmPassword?.value ? null : { passwordMismatch: true };
  }

  formatPhoneNumber(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 6) {
      value = value.substring(0, 3) + '-' + value.substring(3, 6) + '-' + value.substring(6, 10);
    } else if (value.length >= 3) {
      value = value.substring(0, 3) + '-' + value.substring(3);
    }
    this.registerForm.patchValue({ phoneNumber: value });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading.set(true);
      this.errorMessage.set('');
      
      const { confirmPassword, ...registerData } = this.registerForm.value;
      
      // Limpiar el número de teléfono removiendo la máscara
      registerData.phoneNumber = registerData.phoneNumber.replace(/\D/g, '');
      
      this.authService.register(registerData).subscribe({
        next: (response) => {
          this.loading.set(false);
          this.successMessage.set(response.message || 'Cuenta creada exitosamente');
          this.registerForm.reset();
          this.registerForm.patchValue({ 
            role: 'Owner',
            block: '',
            apartment: ''
          });
          this.registerForm.get('apartment')?.disable();
          this.apartments.set([]);
        },
        error: (error) => {
          this.errorMessage.set(error.error?.message || 'Error al registrar usuario');
          this.loading.set(false);
        }
      });
    }
  }
}