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
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: float 8s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateX(0px) rotate(0deg); }
      50% { transform: translateX(-30px) rotate(180deg); }
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
      padding: 2rem;
      overflow-y: auto;
    }

    .auth-form {
      width: 100%;
      max-width: 500px;
    }

    .form-header {
      text-align: center;
      margin-bottom: 2rem;
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

    .register-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-label {
      color: #374151;
      font-weight: 600;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      font-size: 0.875rem;
    }

    .form-control, .form-select {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 0.9rem;
      transition: all 0.3s ease;
      background: #f9fafb;
    }

    .form-control:focus, .form-select:focus {
      outline: none;
      border-color: #9ca3af;
      background: white;
      box-shadow: 0 0 0 3px rgba(156, 163, 175, 0.1);
    }

    .form-control::placeholder {
      color: #9ca3af;
    }

    .form-select {
      color: #374151;
    }

    .form-select option {
      background: white;
      color: #374151;
    }

    .form-select option:first-child {
      color: #9ca3af;
    }

    .form-select:invalid,
    .form-select[value=""],
    .form-select:disabled {
      color: #9ca3af;
    }

    .form-select:disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }

    .btn {
      width: 100%;
      padding: 1rem 1.5rem;
      border-radius: 8px;
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
      padding: 0.75rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
    }

    .success-message {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #16a34a;
      padding: 0.75rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
    }

    .form-footer {
      text-align: center;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
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
            <i class="pi pi-users"></i>
          </div>
          <h1 class="brand-title">CondoFlow</h1>
          <p class="brand-subtitle">Crea tu cuenta y comienza a gestionar</p>
          <div class="brand-features">
            <div class="feature">
              <i class="pi pi-shield"></i>
              <span>Seguro y Confiable</span>
            </div>
            <div class="feature">
              <i class="pi pi-mobile"></i>
              <span>Acceso desde cualquier lugar</span>
            </div>
            <div class="feature">
              <i class="pi pi-clock"></i>
              <span>Disponible 24/7</span>
            </div>
            <div class="feature">
              <i class="pi pi-users"></i>
              <span>Comunidad conectada</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="auth-right">
        <div class="auth-form">
          <div class="form-header">
            <h2>Crear Cuenta</h2>
            <p>Completa tus datos para unirte a CondoFlow</p>
          </div>
          
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">
                  <i class="pi pi-user me-2"></i>
                  Nombre
                </label>
                <input 
                  formControlName="firstName"
                  type="text"
                  class="form-control"
                  placeholder="Tu nombre"
                />
              </div>
              <div class="form-group">
                <label class="form-label">
                  <i class="pi pi-user me-2"></i>
                  Apellido
                </label>
                <input 
                  formControlName="lastName"
                  type="text"
                  class="form-control"
                  placeholder="Tu apellido"
                />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">
                  <i class="pi pi-envelope me-2"></i>
                  Correo Electrónico
                </label>
                <input 
                  formControlName="email"
                  type="email"
                  class="form-control"
                  placeholder="tu@email.com"
                />
              </div>
              <div class="form-group">
                <label class="form-label">
                  <i class="pi pi-phone me-2"></i>
                  Teléfono
                </label>
                <input 
                  formControlName="phoneNumber"
                  type="text"
                  class="form-control"
                  placeholder="000-000-0000"
                  (input)="formatPhoneNumber($event)"
                  maxlength="12"
                />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">
                  <i class="pi pi-building me-2"></i>
                  Bloque
                </label>
                <select 
                  formControlName="block"
                  class="form-select"
                  (change)="onBlockChange($event)"
                  required
                >
                  <option value="" disabled selected>Seleccionar bloque</option>
                  @for (block of blocks(); track block.id) {
                    <option [value]="block.id">{{ block.name }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">
                  <i class="pi pi-home me-2"></i>
                  Apartamento
                </label>
                <select 
                  formControlName="apartment"
                  class="form-select"
                  required
                >
                  <option value="" disabled selected>Seleccionar apartamento</option>
                  @for (apt of apartments(); track apt.id) {
                    <option [value]="apt.id">{{ apt.number }}</option>
                  }
                </select>
              </div>
            </div>
            
            <div class="form-row">
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
                    placeholder="Mínimo 6 caracteres"
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
              </div>
              <div class="form-group">
                <label class="form-label">
                  <i class="pi pi-lock me-2"></i>
                  Confirmar Contraseña
                </label>
                <div style="position: relative;">
                  <input 
                    formControlName="confirmPassword"
                    [type]="showConfirmPassword() ? 'text' : 'password'"
                    class="form-control"
                    placeholder="Repite tu contraseña"
                    style="padding-right: 3rem;"
                  />
                  <button 
                    type="button"
                    (click)="toggleConfirmPassword()"
                    style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); border: none; background: none; color: #6c757d; cursor: pointer;"
                  >
                    <i [class]="showConfirmPassword() ? 'pi pi-eye-slash' : 'pi pi-eye'" style="font-size: 1.1rem;"></i>
                  </button>
                </div>
              </div>
            </div>

            @if (errorMessage()) {
              <div class="error-message">
                <i class="pi pi-exclamation-triangle me-2"></i>
                {{ errorMessage() }}
              </div>
            }

            @if (successMessage()) {
              <div class="success-message">
                <i class="pi pi-check-circle me-2"></i>
                {{ successMessage() }}
              </div>
            }

            <button 
              type="submit" 
              class="btn btn-primary"
              [disabled]="registerForm.invalid || loading()"
            >
              @if (loading()) {
                <span class="spinner-border spinner-border-sm me-2"></span>
                Creando cuenta...
              } @else {
                <i class="pi pi-user-plus me-2"></i>
                Crear Cuenta
              }
            </button>
          </form>
          
          <div class="form-footer">
            <p>
              ¿Ya tienes cuenta? 
              <a routerLink="/login" class="auth-link">
                Iniciar sesión aquí
              </a>
            </p>
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
  showPassword = signal(false);
  showConfirmPassword = signal(false);

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
        console.log('Blocks response:', response);
        if (response.success) {
          const blocksData = response.data.map((block: any) => ({
            id: block.id,
            name: block.name,
            label: block.name
          }));
          this.blocks.set(blocksData);
          console.log('Blocks loaded:', blocksData);
        }
      },
      error: (err) => {
        console.error('Error loading blocks:', err);
        this.blocks.set([]);
      }
    });
  }

  onBlockChange(event: any): void {
    const blockId = parseInt(event.target.value);
    console.log('Block selected:', blockId);
    
    if (blockId) {
      this.registerForm.get('apartment')?.enable();
      
      // Buscar el bloque seleccionado para obtener su nombre
      const selectedBlock = this.blocks().find(b => b.id === blockId);
      const blockName = selectedBlock?.name;
      
      if (blockName) {
        this.http.get<any>(`${this.authService.getApiUrl()}/apartments/by-block/${blockName}`).subscribe({
          next: (response) => {
            console.log('Apartments response:', response);
            if (response.success) {
              const apartmentsData = response.data.map((apt: any) => ({
                id: apt.id,
                number: apt.number.trim(),
                label: apt.number.trim()
              }));
              this.apartments.set(apartmentsData);
              console.log('Apartments loaded:', apartmentsData);
            }
          },
          error: (err) => {
            console.error('Error loading apartments:', err);
            this.apartments.set([]);
          }
        });
      }
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

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading.set(true);
      this.errorMessage.set('');
      
      const { confirmPassword, block, apartment, ...registerData } = this.registerForm.value;
      
      // Limpiar el número de teléfono removiendo la máscara
      registerData.phoneNumber = registerData.phoneNumber.replace(/\D/g, '');
      
      // Enviar tanto blockId como apartmentId
      registerData.blockId = parseInt(block);
      registerData.apartmentId = parseInt(apartment);
      
      console.log('Sending registration data:', registerData);
      
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