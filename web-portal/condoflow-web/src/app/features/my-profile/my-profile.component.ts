import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { NavbarComponent } from '../../shared/components/navbar.component';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NavbarComponent],
  template: `
    <div class="profile-layout">
      <app-navbar></app-navbar>

      <div class="main-content">
        <div class="profile-header">
          <div class="profile-avatar">
            <div class="avatar-circle">{{ getUserInitials() }}</div>
          </div>
          <div class="profile-info">
            <h1>{{ currentUser()?.firstName }} {{ currentUser()?.lastName }}</h1>
          </div>
        </div>

        <div class="profile-tabs">
          <button 
            class="tab-button" 
            [class.active]="activeTab() === 'info'"
            (click)="setActiveTab('info')">
            <i class="pi pi-user"></i>
            Información
          </button>
          <button 
            class="tab-button" 
            [class.active]="activeTab() === 'edit'"
            (click)="setActiveTab('edit')">
            <i class="pi pi-pencil"></i>
            Editar
          </button>
          <button 
            class="tab-button" 
            [class.active]="activeTab() === 'security'"
            (click)="setActiveTab('security')">
            <i class="pi pi-shield"></i>
            Seguridad
          </button>
          <button 
            class="tab-button" 
            [class.active]="activeTab() === 'notifications'"
            (click)="setActiveTab('notifications')">
            <i class="pi pi-bell"></i>
            Notificaciones
          </button>
        </div>

        <!-- Tab: Información -->
        @if (activeTab() === 'info') {
          <div class="profile-card">
            <div class="info-section">
              <h3>Información Personal</h3>
              <div class="info-row">
                <span class="label"><i class="pi pi-user me-2"></i>Nombre</span>
                <span class="value">{{ currentUser()?.firstName }} {{ currentUser()?.lastName }}</span>
              </div>
              <div class="info-row">
                <span class="label"><i class="pi pi-envelope me-2"></i>Email</span>
                <span class="value">{{ currentUser()?.email }}</span>
              </div>
              <div class="info-row">
                <span class="label"><i class="pi pi-phone me-2"></i>Teléfono</span>
                <span class="value">{{ formatPhoneNumber(userDetails()?.phoneNumber) || 'Cargando...' }}</span>
              </div>
            </div>
            
            <div class="info-section">
              <h3>Apartamento</h3>
              <div class="info-row">
                <span class="label"><i class="pi pi-home me-2"></i>Ubicación</span>
                <span class="value">Bloque {{ userDetails()?.block }}, Apartamento {{ userDetails()?.apartment }}</span>
              </div>
              <div class="info-row">
                <span class="label"><i class="pi pi-check-circle me-2"></i>Estado</span>
                <span class="value status" [class.approved]="userDetails()?.isApproved" [class.rejected]="!userDetails()?.isApproved">
                  {{ userDetails()?.isApproved ? 'Aprobada' : 'Pendiente' }}
                </span>
              </div>
              <div class="info-row">
                <span class="label"><i class="pi pi-calendar me-2"></i>Miembro desde</span>
                <span class="value">{{ formatDate(userDetails()?.createdAt) }}</span>
              </div>
            </div>
          </div>
        }

        <!-- Tab: Editar Perfil -->
        @if (activeTab() === 'edit') {
          <div class="profile-card">
            <form [formGroup]="editForm" (ngSubmit)="onSaveProfile()">
              <div class="form-section">
                <h3>Editar Información Personal</h3>
                <div class="form-grid">
                  <div class="form-group">
                    <label><i class="pi pi-user me-2"></i>Nombre</label>
                    <input type="text" formControlName="firstName" class="form-input">
                  </div>
                  <div class="form-group">
                    <label><i class="pi pi-user me-2"></i>Apellido</label>
                    <input type="text" formControlName="lastName" class="form-input">
                  </div>
                  <div class="form-group">
                    <label><i class="pi pi-phone me-2"></i>Teléfono</label>
                    <input type="tel" formControlName="phoneNumber" class="form-input">
                  </div>
                </div>
              </div>
              
              <div class="form-actions">
                <button type="button" class="btn-secondary" (click)="resetForm()">Cancelar</button>
                <button type="submit" class="btn-primary" [disabled]="editForm.invalid || saving()">
                  {{ saving() ? 'Guardando...' : 'Guardar Cambios' }}
                </button>
              </div>
            </form>
          </div>
        }

        <!-- Tab: Seguridad -->
        @if (activeTab() === 'security') {
          <div class="profile-card">
            <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()">
              <div class="form-section">
                <h3>Cambiar Contraseña</h3>
                <div class="form-grid">
                  <div class="form-group">
                    <label><i class="pi pi-lock me-2"></i>Contraseña Actual</label>
                    <input type="password" formControlName="currentPassword" class="form-input">
                  </div>
                  <div class="form-group">
                    <label><i class="pi pi-key me-2"></i>Nueva Contraseña</label>
                    <input type="password" formControlName="newPassword" class="form-input">
                  </div>
                  <div class="form-group">
                    <label><i class="pi pi-shield me-2"></i>Confirmar Contraseña</label>
                    <input type="password" formControlName="confirmPassword" class="form-input">
                    @if (passwordForm.get('confirmPassword')?.errors?.['passwordMismatch'] && passwordForm.get('confirmPassword')?.touched) {
                      <span style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem;">Las contraseñas no coinciden</span>
                    }
                  </div>
                </div>
              </div>
              
              <div class="form-actions">
                <button type="button" class="btn-secondary" (click)="resetPasswordForm()">Cancelar</button>
                <button type="submit" class="btn-primary" [disabled]="passwordForm.invalid || changingPassword()">
                  {{ changingPassword() ? 'Cambiando...' : 'Cambiar Contraseña' }}
                </button>
              </div>
            </form>
          </div>
        }

        <!-- Tab: Notificaciones -->
        @if (activeTab() === 'notifications') {
          <div class="profile-card">
            <div class="form-section">
              <h3>Preferencias de Notificaciones</h3>
              <div class="notification-settings">
                <div class="setting-item">
                  <div class="setting-info">
                    <span class="setting-title"><i class="pi pi-credit-card me-2"></i>Notificaciones de Pagos</span>
                    <span class="setting-desc">Recibir notificaciones cuando se procesen pagos</span>
                  </div>
                  <label class="toggle">
                    <input type="checkbox" [(ngModel)]="notificationSettings.payments">
                    <span class="slider"></span>
                  </label>
                </div>
                
                <div class="setting-item">
                  <div class="setting-info">
                    <span class="setting-title"><i class="pi pi-clock me-2"></i>Recordatorios de Vencimiento</span>
                    <span class="setting-desc">Recordatorios antes del vencimiento de deudas</span>
                  </div>
                  <label class="toggle">
                    <input type="checkbox" [(ngModel)]="notificationSettings.reminders">
                    <span class="slider"></span>
                  </label>
                </div>
                
                <div class="setting-item">
                  <div class="setting-info">
                    <span class="setting-title"><i class="pi pi-megaphone me-2"></i>Anuncios del Condominio</span>
                    <span class="setting-desc">Notificaciones de anuncios y comunicados</span>
                  </div>
                  <label class="toggle">
                    <input type="checkbox" [(ngModel)]="notificationSettings.announcements">
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
              
              <div class="form-actions">
                <button type="button" class="btn-primary" (click)="saveNotificationSettings()">
                  Guardar Preferencias
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .profile-layout { min-height: 100vh; background: #f8fafc; }
    .top-nav { background: white; border-bottom: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); }
    .nav-container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; height: 4rem; }
    .brand { display: flex; align-items: center; gap: 0.75rem; }
    .brand-icon { width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #2563EB, #1d4ed8); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.25rem; }
    .brand-name { font-size: 1.5rem; font-weight: 700; color: #1f2937; }
    .user-section { display: flex; align-items: center; gap: 1rem; }
    .user-info { display: flex; align-items: center; gap: 0.75rem; }
    .user-avatar { background: linear-gradient(135deg, #10B981, #059669); color: white; font-weight: 600; width: 2.25rem; height: 2.25rem; font-size: 0.875rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .user-details { display: flex; flex-direction: column; }
    .user-name { font-weight: 600; color: #1f2937; font-size: 0.875rem; }
    .user-role { font-size: 0.75rem; color: #6b7280; }
    .logout-button { background: transparent; border: 1px solid #e5e7eb; color: #6b7280; width: 2.25rem; height: 2.25rem; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; }
    .logout-button:hover { border-color: #fca5a5; color: #ef4444; background: #fef2f2; }
    
    .main-content { max-width: 1000px; margin: 0 auto; padding: 2rem; width: 100%; }
    
    .profile-header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; }
    .profile-avatar .avatar-circle { width: 4rem; height: 4rem; background: linear-gradient(135deg, #2563EB, #1d4ed8); color: white; font-weight: 700; font-size: 1.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .profile-info h1 { font-size: 1.875rem; font-weight: 700; color: #1f2937; margin: 0; }
    .profile-info p { color: #6b7280; margin: 0.25rem 0 0 0; }
    
    .profile-tabs { display: flex; background: white; border-radius: 8px; padding: 0.25rem; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
    .tab-button { flex: 1; padding: 0.75rem 1rem; border: none; background: transparent; color: #6b7280; font-weight: 500; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .tab-button:hover { background: #f1f5f9; color: #374151; }
    .tab-button.active { background: #2563EB; color: white; }
    
    .profile-card { background: white; border-radius: 8px; padding: 2rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
    
    .info-section { margin-bottom: 2rem; }
    .info-section:last-child { margin-bottom: 0; }
    .info-section h3 { font-size: 1.125rem; font-weight: 600; color: #1f2937; margin: 0 0 1rem 0; }
    .info-row { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9; }
    .info-row:last-child { border-bottom: none; }
    .info-row .label { font-weight: 500; color: #6b7280; }
    .info-row .value { color: #1f2937; font-weight: 500; }
    .status.approved { color: #059669; background: #f0fdf4; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.875rem; }
    .status.rejected { color: #dc2626; background: #fef2f2; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.875rem; }
    
    .form-section { margin-bottom: 2rem; }
    .form-section h3 { font-size: 1.125rem; font-weight: 600; color: #1f2937; margin: 0 0 1.5rem 0; }
    .form-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group label { font-weight: 500; color: #374151; font-size: 0.875rem; }
    .form-input { padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; transition: border-color 0.2s ease; }
    .form-input:focus { outline: none; border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
    
    .form-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem; }
    .btn-primary { background: #2563EB; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 500; cursor: pointer; transition: background 0.2s ease; }
    .btn-primary:hover:not(:disabled) { background: #1d4ed8; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { background: white; color: #6b7280; border: 1px solid #d1d5db; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; }
    .btn-secondary:hover { background: #f9fafb; border-color: #9ca3af; }
    
    .notification-settings { display: flex; flex-direction: column; gap: 1rem; }
    .setting-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; }
    .setting-info { display: flex; flex-direction: column; gap: 0.25rem; }
    .setting-title { font-weight: 500; color: #1f2937; }
    .setting-desc { font-size: 0.875rem; color: #6b7280; }
    
    .toggle { position: relative; display: inline-block; width: 3rem; height: 1.5rem; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: 0.4s; border-radius: 1.5rem; }
    .slider:before { position: absolute; content: ""; height: 1.125rem; width: 1.125rem; left: 0.1875rem; bottom: 0.1875rem; background-color: white; transition: 0.4s; border-radius: 50%; }
    input:checked + .slider { background-color: #2563EB; }
    input:checked + .slider:before { transform: translateX(1.5rem); }
    
    @media (min-width: 768px) {
      .form-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class MyProfileComponent implements OnInit {
  currentUser = signal<any>(null);
  userDetails = signal<any>(null);
  loading = signal(true);
  activeTab = signal('info');
  saving = signal(false);
  changingPassword = signal(false);
  
  editForm: FormGroup;
  passwordForm: FormGroup;
  
  notificationSettings = {
    payments: true,
    reminders: true,
    announcements: false
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: ['', Validators.required]
    });
    
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.currentUser.set(this.authService.currentUser());
    this.loadUserDetails();
    this.loadNotificationSettings();
  }

  loadUserDetails() {
    const user = this.currentUser();
    if (!user?.ownerId) return;

    this.http.get(`${environment.apiUrl}/users/profile`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.userDetails.set(response.data);
          this.populateEditForm();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando detalles del usuario:', error);
        this.loading.set(false);
      }
    });
  }

  populateEditForm() {
    const user = this.currentUser();
    const details = this.userDetails();
    
    this.editForm.patchValue({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phoneNumber: this.formatPhoneNumber(details?.phoneNumber) || ''
    });
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }

  onSaveProfile() {
    if (this.editForm.valid) {
      this.saving.set(true);
      
      const profileData = {
        firstName: this.editForm.get('firstName')?.value,
        lastName: this.editForm.get('lastName')?.value,
        phoneNumber: this.editForm.get('phoneNumber')?.value
      };
      
      this.http.put(`${environment.apiUrl}/users/profile`, profileData).subscribe({
        next: (response: any) => {
          this.saving.set(false);
          if (response.success) {
            // Actualizar currentUser en memoria
            const updatedUser = {
              ...this.currentUser(),
              firstName: profileData.firstName,
              lastName: profileData.lastName
            };
            this.currentUser.set(updatedUser);
            this.authService.updateCurrentUser(updatedUser);
            
            // Mostrar mensaje de éxito
            const successMessage = document.createElement('div');
            successMessage.innerHTML = `
              <div style="position: fixed; top: 20px; right: 20px; background: #10B981; color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; font-weight: 500;">
                <i class="pi pi-check-circle" style="margin-right: 0.5rem;"></i>
Información personal actualizada exitosamente
              </div>
            `;
            document.body.appendChild(successMessage);
            setTimeout(() => document.body.removeChild(successMessage), 3000);
            this.loadUserDetails(); // Recargar datos
          }
        },
        error: (error) => {
          this.saving.set(false);
          console.error('Error actualizando perfil:', error);
          // Mostrar mensaje de error
          const errorMessage = document.createElement('div');
          errorMessage.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: #EF4444; color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; font-weight: 500;">
              <i class="pi pi-times-circle" style="margin-right: 0.5rem;"></i>
              Error al actualizar el perfil
            </div>
          `;
          document.body.appendChild(errorMessage);
          setTimeout(() => document.body.removeChild(errorMessage), 3000);
        }
      });
    }
  }

  onChangePassword() {
    if (this.passwordForm.valid) {
      this.changingPassword.set(true);
      
      const passwordData = {
        currentPassword: this.passwordForm.get('currentPassword')?.value,
        newPassword: this.passwordForm.get('newPassword')?.value
      };
      
      this.http.put(`${environment.apiUrl}/users/change-password`, passwordData).subscribe({
        next: (response: any) => {
          this.changingPassword.set(false);
          if (response.success) {
            const successMessage = document.createElement('div');
            successMessage.innerHTML = `
              <div style="position: fixed; top: 20px; right: 20px; background: #10B981; color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; font-weight: 500;">
                <i class="pi pi-check-circle" style="margin-right: 0.5rem;"></i>
                Contraseña cambiada exitosamente
              </div>
            `;
            document.body.appendChild(successMessage);
            setTimeout(() => document.body.removeChild(successMessage), 3000);
            this.resetPasswordForm();
          }
        },
        error: (error) => {
          this.changingPassword.set(false);
          console.error('Error cambiando contraseña:', error);
          const errorMessage = document.createElement('div');
          errorMessage.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: #EF4444; color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; font-weight: 500;">
              <i class="pi pi-times-circle" style="margin-right: 0.5rem;"></i>
              ${error.error?.message || 'Error al cambiar la contraseña'}
            </div>
          `;
          document.body.appendChild(errorMessage);
          setTimeout(() => document.body.removeChild(errorMessage), 3000);
        }
      });
    }
  }

  resetForm() {
    this.populateEditForm();
  }

  resetPasswordForm() {
    this.passwordForm.reset();
  }

  saveNotificationSettings() {
    // Guardar en localStorage por ahora - después conectar con backend
    localStorage.setItem('notificationSettings', JSON.stringify(this.notificationSettings));
    
    const successMessage = document.createElement('div');
    successMessage.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; background: #10B981; color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; font-weight: 500;">
        <i class="pi pi-check-circle" style="margin-right: 0.5rem;"></i>
        Preferencias de notificaciones guardadas exitosamente
      </div>
    `;
    document.body.appendChild(successMessage);
    setTimeout(() => document.body.removeChild(successMessage), 3000);
  }

  navigateToHome(): void {
    this.router.navigate(['/welcome']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'U';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'No disponible';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'No disponible';
    return date.toLocaleDateString('es-ES');
  }

  formatPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return '';
    // Si empieza con 1 y tiene 11 dígitos, quitar el 1
    if (phoneNumber.startsWith('1') && phoneNumber.length === 11) {
      return phoneNumber.substring(1);
    }
    return phoneNumber;
  }

  loadNotificationSettings() {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      this.notificationSettings = JSON.parse(saved);
    }
  }

  passwordMatchValidator(form: any) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }
}