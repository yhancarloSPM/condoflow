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
    <div class="management-layout">
      <app-navbar></app-navbar>
      
      <div class="main-content">
        <div class="header-card">
          <div class="header-content">
            <div class="header-info">
              <div class="header-icon">
                <i class="pi pi-megaphone"></i>
              </div>
              <div class="header-text">
                <h2 class="header-title">Comunicados</h2>
                <p class="header-subtitle">Res. Michelle Marie II - Mantente informado sobre las novedades importantes</p>
              </div>
            </div>
          </div>
        </div>

        <div class="main-card card">
          <div class="card-body">
            @if (loading()) {
              <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="text-white mt-2">Cargando comunicados...</p>
              </div>
            } @else if (announcements().length === 0) {
              <div class="text-center py-5">
                <h6 class="text-white mt-3">No hay comunicados disponibles</h6>
                <p class="text-white small">Cuando la administración publique comunicados, aparecerán aquí</p>
              </div>
            } @else {
              <div class="announcements-grid">
                @for (announcement of getPaginatedAnnouncements(); track announcement.id) {
                  <div class="announcement-card" [class.urgent]="announcement.isUrgent" [class.event]="isEventType(announcement) && !announcement.isUrgent" [class.info]="!announcement.isUrgent && !isEventType(announcement)">
                    <div class="card-header">
                      <h4 class="card-title">Res. Michelle Marie II</h4>
                      @if (announcement.isUrgent) {
                        <span class="priority-badge urgent">
                          URGENTE
                        </span>
                      } @else if (isEventType(announcement)) {
                        <span class="priority-badge event">
                          {{ (announcement.announcementTypeName || 'EVENTO').toUpperCase() }}
                        </span>
                      } @else {
                        <span class="priority-badge info">
                          {{ (announcement.announcementTypeName || 'INFORMATIVO').toUpperCase() }}
                        </span>
                      }
                    </div>
                    
                    <div class="card-body">
                      <h3 class="announcement-title">{{ announcement.title }}</h3>
                      
                      @if (announcement.eventDate && isEventType(announcement)) {
                        <div class="event-info" [class.urgent]="announcement.isUrgent" [class.event]="!announcement.isUrgent">
                          <i class="pi pi-calendar"></i>
                          <span>{{ announcement.eventDate | date:'EEEE, dd MMMM yyyy - h:mm a':'':'es' }}</span>
                        </div>
                      }
                      
                      <p class="announcement-content">{{ announcement.content }}</p>
                    </div>
                    
                    <div class="card-footer">
                      <div class="announcement-meta">
                        <span class="date">{{ announcement.createdAt | date:'dd/MM/yyyy':'':'es' }}</span>
                        <span class="author">Administración del Condominio</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
              
              @if (totalPages() > 1) {
                <div class="pagination-container">
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
      </div>
    </div>
  `,
  styleUrls: ['./announcements.component.scss']
})
export class AnnouncementsComponent implements OnInit {
  currentUser = signal<any>(null);
  announcements = signal<any[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  pageSize = 4;
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
          // Filtrar solo anuncios activos para owners
          const activeAnnouncements = (response.data || []).filter((announcement: any) => announcement.isActive);
          this.announcements.set(activeAnnouncements);
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

  getUrgentCount(): number {
    return this.announcements().filter(a => a.isUrgent).length;
  }
  
  getInfoCount(): number {
    return this.announcements().filter(a => !a.isUrgent && !this.isEventType(a)).length;
  }
  
  getEventCount(): number {
    return this.announcements().filter(a => this.isEventType(a) && !a.isUrgent).length;
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

  isEventType(announcement: any): boolean {
    const typeName = announcement.announcementTypeName?.toLowerCase();
    return typeName === 'evento';
  }
}