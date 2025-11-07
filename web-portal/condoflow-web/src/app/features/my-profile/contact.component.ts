import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="contact-layout">
      <nav class="top-nav">
        <div class="nav-container">
          <div class="brand" (click)="navigateToHome()" style="cursor: pointer;">
            <div class="brand-icon">
              <i class="pi pi-building"></i>
            </div>
            <span class="brand-name">CondoFlow</span>
          </div>
          <div class="user-section">
            <div class="user-info">
              <div class="user-avatar">{{ getUserInitials() }}</div>
              <div class="user-details">
                <span class="user-name">{{ currentUser()?.firstName }} {{ currentUser()?.lastName }}</span>
                <span class="user-role">Propietario</span>
              </div>
            </div>
            <button type="button" class="logout-button" (click)="logout()">
              <i class="pi pi-sign-out"></i>
            </button>
          </div>
        </div>
      </nav>

      <div class="main-content">
        <div class="page-header">
          <h1>Mi Perfil</h1>
          <p>Información personal y configuración de la cuenta</p>
        </div>

        <div class="contact-card">
          <div class="contact-section">
            <h3>Información Personal</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>Nombre Completo</label>
                <span>{{ currentUser()?.firstName }} {{ currentUser()?.lastName }}</span>
              </div>
              <div class="info-item">
                <label>Email</label>
                <span>{{ currentUser()?.email }}</span>
              </div>
              <div class="info-item">
                <label>Teléfono</label>
                <span>{{ userDetails()?.phoneNumber || 'Cargando...' }}</span>
              </div>
            </div>
          </div>

          <div class="contact-section">
            <h3>Información del Apartamento</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>Bloque</label>
                <span>{{ userDetails()?.block || 'Cargando...' }}</span>
              </div>
              <div class="info-item">
                <label>Apartamento</label>
                <span>{{ userDetails()?.apartment || 'Cargando...' }}</span>
              </div>
              <div class="info-item">
                <label>Dirección Completa</label>
                <span>Bloque {{ userDetails()?.block }}, Apartamento {{ userDetails()?.apartment }}</span>
              </div>
            </div>
          </div>

          <div class="contact-section">
            <h3>Información del Sistema</h3>
            <div class="info-grid">

              <div class="info-item">
                <label>Estado de la Cuenta</label>
                <span [class]="userDetails()?.isApproved ? 'status-approved' : 'status-rejected'">
                  {{ userDetails()?.isApproved ? 'Aprobada' : 'Rechazada' }}
                </span>
              </div>
              <div class="info-item">
                <label>Fecha de Registro</label>
                <span>{{ formatDate(userDetails()?.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contact-layout { min-height: 100vh; background: #f8fafc; }
    .top-nav { background: white; border-bottom: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); }
    .nav-container { max-width: 1400px; margin: 0 auto; padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; height: 4rem; }
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
    
    .main-content { max-width: 800px; margin: 0 auto; padding: 2rem; }
    .page-header h1 { font-size: 2rem; font-weight: 700; color: #1f2937; margin: 0 0 0.5rem 0; }
    .page-header p { color: #6b7280; margin: 0 0 2rem 0; }
    
    .contact-card { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
    .contact-section { margin-bottom: 2rem; }
    .contact-section:last-child { margin-bottom: 0; }
    .contact-section h3 { font-size: 1.25rem; font-weight: 600; color: #1f2937; margin: 0 0 1rem 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
    
    .info-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .info-item label { font-size: 0.875rem; font-weight: 500; color: #6b7280; }
    .info-item span { font-size: 1rem; color: #1f2937; }
    .status-approved { color: #10b981; font-weight: 600; }
    .status-rejected { color: #ef4444; font-weight: 600; }
    
    @media (min-width: 768px) {
      .info-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class ContactComponent implements OnInit {
  currentUser = signal<any>(null);
  userDetails = signal<any>(null);
  loading = signal(true);

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.currentUser.set(this.authService.currentUser());
    this.loadUserDetails();
  }

  loadUserDetails() {
    const user = this.currentUser();
    if (!user?.ownerId) return;

    this.http.get(`${environment.apiUrl}/users/profile`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.userDetails.set(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando detalles del usuario:', error);
        this.loading.set(false);
      }
    });
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
}