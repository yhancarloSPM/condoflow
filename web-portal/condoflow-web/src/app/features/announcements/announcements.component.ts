import { Component, OnInit, signal, LOCALE_ID, Inject } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AnnouncementService } from '../../core/services/announcement.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import localeEs from '@angular/common/locales/es';

registerLocaleData(localeEs);

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  template: `
    <div class="announcements-layout">
      <app-navbar></app-navbar>

      <div class="main-content">
        <div class="page-header">
          <div class="header-content">
            <h1><i class="pi pi-megaphone"></i> Comunicados del Condominio</h1>
            <p>Mantente informado sobre las novedades y comunicados importantes</p>
          </div>
        </div>

        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando comunicados...</p>
          </div>
        } @else if (announcements().length === 0) {
          <div class="empty-state">
            <i class="pi pi-info-circle"></i>
            <h3>No hay comunicados disponibles</h3>
            <p>Cuando la administración publique comunicados, aparecerán aquí</p>
          </div>
        } @else {
          <div class="announcements-grid">
            @for (announcement of getPaginatedAnnouncements(); track announcement.id) {
              <div class="announcement-card" [class.urgent]="announcement.isUrgent" [class.event]="announcement.eventDate && !announcement.isUrgent">
                <div class="card-header">
                  @if (announcement.isUrgent) {
                    <div class="urgent-badge">URGENTE</div>
                  } @else if (announcement.eventDate) {
                    <div class="event-badge">EVENTO</div>
                  } @else {
                    <div class="info-badge">INFORMATIVO</div>
                  }
                </div>
                
                <div class="card-body">
                  <h3>{{ announcement.title }}</h3>
                  @if (announcement.eventDate) {
                    <div class="event-date">
                      <i class="pi pi-calendar"></i>
                      <span>{{ announcement.eventDate | date:'EEEE, dd MMMM yyyy - h:mm a':'':'es' }}</span>
                    </div>
                  }
                  <p>{{ announcement.content }}</p>
                </div>
                
                <div class="card-footer">
                  <span class="author">Administración del Condominio</span>
                  <span class="publish-date">{{ announcement.createdAt | date:'dd/MM/yyyy - h:mm a':'':'es' }}</span>
                </div>
              </div>
            }
          </div>
          
          @if (totalPages() > 1) {
            <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <div>
                <small class="text-muted">
                  Mostrando {{ (currentPage() - 1) * pageSize + 1 }} - {{ Math.min(currentPage() * pageSize, announcements().length) }} de {{ announcements().length }} comunicados
                </small>
              </div>
              <div class="pagination">
                <button 
                  class="pagination-btn" 
                  [disabled]="currentPage() === 1"
                  (click)="goToPage(currentPage() - 1)">
                  <i class="pi pi-chevron-left"></i>
                </button>
                
                @for (page of getPageNumbers(); track page) {
                  @if (page === '...') {
                    <span class="pagination-dots">...</span>
                  } @else {
                    <button 
                      class="pagination-btn"
                      [class.active]="page === currentPage()"
                      (click)="goToPage($any(page))">
                      {{ page }}
                    </button>
                  }
                }
                
                <button 
                  class="pagination-btn" 
                  [disabled]="currentPage() === totalPages()"
                  (click)="goToPage(currentPage() + 1)">
                  <i class="pi pi-chevron-right"></i>
                </button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .announcements-layout { min-height: 100vh; background: #f8fafc; }
    .top-nav { background: white; border-bottom: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); }
    .nav-container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; height: 4rem; }
    .brand { display: flex; align-items: center; gap: 0.75rem; }
    .brand-icon { width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 1.25rem; }
    .brand-name { font-size: 1.5rem; font-weight: 700; color: #1f2937; }
    .user-section { display: flex; align-items: center; gap: 1rem; }
    .user-info { display: flex; align-items: center; gap: 0.75rem; }
    .user-avatar { background: linear-gradient(135deg, #10B981, #059669); color: white; font-weight: 600; width: 2.25rem; height: 2.25rem; font-size: 0.875rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .user-details { display: flex; flex-direction: column; }
    .user-name { font-weight: 600; color: #1f2937; font-size: 0.875rem; }
    .user-role { font-size: 0.75rem; color: #6b7280; }
    .logout-button { background: transparent; border: 1px solid #e5e7eb; color: #6b7280; width: 2.25rem; height: 2.25rem; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; }
    .logout-button:hover { border-color: #fca5a5; color: #ef4444; background: #fef2f2; }

    .main-content { width: 100%; padding: 2rem; }
    .page-header { margin-bottom: 2rem; }

    .header-content h1 { font-size: 2rem; font-weight: 700; color: #1f2937; margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 0.75rem; }
    .header-content h1 i { color: #6b7280; }
    .header-content p { color: #6b7280; margin: 0; }

    .loading-state, .empty-state { text-align: center; padding: 4rem 2rem; color: #6b7280; }
    .spinner { width: 2rem; height: 2rem; border: 2px solid #e5e7eb; border-top: 2px solid #2563EB; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem auto; }
    .empty-state i { font-size: 4rem; margin-bottom: 1rem; color: #9ca3af; }
    .empty-state h3 { font-size: 1.5rem; font-weight: 600; color: #374151; margin: 0 0 0.5rem 0; }

    .announcements-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
    .announcement-card { background: white; border-radius: 8px; border: 1px solid #e5e7eb; transition: all 0.3s ease; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); height: 240px; }
    .announcement-card:hover { box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1); transform: translateY(-2px); }
    .announcement-card.urgent { border-left: 4px solid #ef4444; background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%); }
    .announcement-card:not(.urgent):not(.event) { border-left: 4px solid #10b981; background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%); }
    .announcement-card.event { border-left: 4px solid #f59e0b; background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%); }

    .card-header { display: flex; justify-content: flex-end; align-items: flex-start; padding: 1.5rem 1.5rem 0 1.5rem; }
    .urgent-badge { background: transparent; color: #dc2626; border: 1px solid #dc2626; padding: 0.375rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    .info-badge { background: transparent; color: #198754; border: 1px solid #198754; padding: 0.375rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    .event-badge { background: transparent; color: #f59e0b; border: 1px solid #f59e0b; padding: 0.375rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }

    .card-body { padding: 0.5rem 0.75rem; }
    .card-body h3 { font-size: 0.9rem; font-weight: 700; color: #1f2937; margin: 0 0 0.4rem 0; line-height: 1.2; }
    .event-date { display: flex; align-items: center; gap: 0.75rem; background: linear-gradient(135deg, #fef3c7, #fde68a); color: #92400e; padding: 0.75rem 1rem; border-radius: 10px; margin: 0.75rem 0; font-size: 0.875rem; font-weight: 500; border: 1px solid #fbbf24; }
    .event-date i { color: #f59e0b; font-size: 1rem; }
    .card-body p { color: #64748b; font-size: 0.85rem; line-height: 1.5; margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

    .card-footer { display: flex; justify-content: space-between; align-items: center; padding: 0 0.75rem 0.5rem 0.75rem; border-top: 1px solid #f1f5f9; margin-top: auto; padding-top: 0.5rem; }
    .author { color: #64748b; font-size: 0.8rem; font-weight: 500; display: flex; align-items: center; gap: 0.5rem; }
    .author::before { content: '👤'; font-size: 0.875rem; }
    .publish-date { color: #9ca3af; font-size: 0.8rem; font-weight: 400; display: flex; align-items: center; gap: 0.5rem; }
    .publish-date::before { content: '📅'; font-size: 0.875rem; }

    .pagination {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .pagination-btn {
      padding: 0.5rem 0.75rem;
      border: 1px solid #e5e7eb;
      background: white;
      color: #6b7280;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.875rem;
      min-width: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pagination-btn:hover:not(:disabled) {
      border-color: #2563EB;
      color: #2563EB;
      background: #eff6ff;
    }

    .pagination-btn.active {
      background: #2563EB;
      color: white;
      border-color: #2563EB;
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pagination-dots {
      padding: 0.5rem 0.75rem;
      color: #6b7280;
      font-weight: 500;
    }

    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .main-content { padding: 1rem; }
      .header-content h1 { font-size: 1.5rem; }
      .announcements-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AnnouncementsComponent implements OnInit {
  currentUser = signal<any>(null);
  announcements = signal<any[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  pageSize = 8;
  totalPages = signal(1);

  constructor(
    private authService: AuthService,
    private router: Router,
    private announcementService: AnnouncementService
  ) {}

  ngOnInit() {
    this.currentUser.set(this.authService.currentUser());
    this.loadAnnouncements();
  }

  loadAnnouncements() {
    this.announcementService.getAnnouncements().subscribe({
      next: (response) => {
        if (response.success) {
          this.announcements.set(response.data || []);
          this.calculateTotalPages();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando comunicados:', error);
        this.announcements.set([]);
        this.loading.set(false);
      }
    });
  }

  calculateTotalPages() {
    const total = Math.ceil(this.announcements().length / this.pageSize);
    this.totalPages.set(total);
  }

  getPaginatedAnnouncements() {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.announcements().slice(start, end);
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.totalPages();
    const current = this.currentPage();
    
    if (total <= 5) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (current > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== total) {
          pages.push(i);
        }
      }
      
      if (current < total - 2) {
        pages.push('...');
      }
      
      pages.push(total);
    }
    
    return pages;
  }
  
  Math = Math;

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  goBack() {
    this.router.navigate(['/welcome']);
  }

  navigateToHome() {
    this.router.navigate(['/welcome']);
  }

  logout() {
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
}