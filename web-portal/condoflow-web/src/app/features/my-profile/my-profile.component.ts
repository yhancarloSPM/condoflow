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
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss']
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
      firstName: ['', [Validators.required, this.nameValidator]],
      lastName: ['', [Validators.required, this.nameValidator]],
      phoneNumber: ['', [Validators.required, this.dominicanPhoneValidator]]
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
    
    // Limpiar el número antes de mostrarlo en el formulario
    let phoneNumber = details?.phoneNumber || '';
    if (phoneNumber) {
      phoneNumber = phoneNumber.replace(/\D/g, '');
      if (phoneNumber.startsWith('1') && phoneNumber.length === 11) {
        phoneNumber = phoneNumber.substring(1);
      }
    }
    
    // Guardar el número limpio en el formulario
    this.editForm.patchValue({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phoneNumber: phoneNumber
    });
  }

  applyPhoneFormat(value: string): string {
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length === 0) return '';
    
    let formatted = '(' + cleaned.substring(0, Math.min(3, cleaned.length));
    if (cleaned.length > 3) {
      formatted += ') ' + cleaned.substring(3, Math.min(6, cleaned.length));
      if (cleaned.length > 6) {
        formatted += '-' + cleaned.substring(6, Math.min(10, cleaned.length));
      }
    }
    
    return formatted;
  }

  onPhoneNumberInput(event: any) {
    const input = event.target;
    
    // Obtener solo los números del valor actual
    let value = input.value.replace(/\D/g, '');
    
    // Limitar a 10 dígitos
    if (value.length > 10) {
      value = value.substring(0, 10);
    }
    
    // Guardar posición del cursor antes del cambio
    const cursorPos = input.selectionStart || 0;
    const prevValue = input.value;
    
    // Aplicar formato
    const formatted = this.applyPhoneFormat(value);
    
    // Actualizar el input
    input.value = formatted;
    
    // Ajustar cursor: si agregamos caracteres de formato, mover el cursor
    let newCursorPos = cursorPos;
    if (formatted.length > prevValue.length) {
      // Se agregó formato, ajustar cursor
      if (cursorPos === 4 && formatted.charAt(3) === ')') {
        newCursorPos = cursorPos + 2; // Después de ") "
      } else if (cursorPos === 9 && formatted.charAt(8) === '-') {
        newCursorPos = cursorPos + 1; // Después de "-"
      }
    }
    
    // Restaurar posición del cursor
    setTimeout(() => {
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
    
    // Actualizar el formulario con el valor sin formato
    this.editForm.get('phoneNumber')?.setValue(value, { emitEvent: false });
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
    
    // Limpiar el número de cualquier formato previo
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Si empieza con 1 y tiene 11 dígitos, quitar el 1
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      cleaned = cleaned.substring(1);
    }
    
    // Aplicar formato (809) 123-4567
    if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
    }
    
    // Si tiene menos de 10 dígitos, aplicar formato parcial
    if (cleaned.length > 6) {
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
    } else if (cleaned.length > 3) {
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3)}`;
    } else if (cleaned.length > 0) {
      return `(${cleaned}`;
    }
    
    return cleaned;
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

  dominicanPhoneValidator(control: any) {
    if (!control.value) {
      return null;
    }
    
    const phoneNumber = control.value.replace(/\D/g, '');
    
    // Debe tener exactamente 10 dígitos
    if (phoneNumber.length !== 10) {
      return { invalidPhone: true };
    }
    
    // Debe iniciar con 809, 829 o 849
    const validPrefixes = ['809', '829', '849'];
    const prefix = phoneNumber.substring(0, 3);
    
    if (!validPrefixes.includes(prefix)) {
      return { invalidPrefix: true };
    }
    
    return null;
  }

  nameValidator(control: any) {
    if (!control.value) {
      return null;
    }
    
    // Solo permite letras (incluyendo acentos y ñ) y espacios
    const namePattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    
    if (!namePattern.test(control.value)) {
      return { invalidName: true };
    }
    
    return null;
  }
}