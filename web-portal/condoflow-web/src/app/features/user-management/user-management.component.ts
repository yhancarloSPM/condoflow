import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MenubarModule } from 'primeng/menubar';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ToastModule } from 'primeng/toast';

import { MenuItem, MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { AdminService } from '../../core/services/admin.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserStatus } from '../../shared/enums/user-status.enum';
import { NavbarComponent } from '../../shared/components/navbar.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    CardModule,
    TagModule,
    MenubarModule,
    AvatarModule,
    BadgeModule,
    ToastModule,
    NavbarComponent
  ],
  providers: [MessageService],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit, OnDestroy {
  allUsers = signal<any[]>([]);
  filteredUsers = signal<any[]>([]);
  loading = signal(false);
  approvingUser = signal<string | null>(null);
  rejectingUser = signal<string | null>(null);
  currentUser = signal<any>(null);
  currentPage = signal(1);
  pageSize = 10;
  statusFilter = '';
  searchTerm = '';
  
  paginatedUsers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredUsers().slice(start, end);
  });
  
  totalPages = computed(() => Math.ceil(this.filteredUsers().length / this.pageSize));
  
  statusCounts = computed(() => {
    const users = this.allUsers();
    return {
      pending: users.filter(u => !u.isApproved && !u.isRejected).length,
      approved: users.filter(u => u.isApproved).length,
      rejected: users.filter(u => u.isRejected).length
    };
  });
  menuItems: MenuItem[] = [];
  showConfirmDialog = signal(false);
  confirmMessage = signal('');
  confirmAction = signal<'approve' | 'reject'>('approve');
  pendingUserId = signal<string | null>(null);
  pendingUserInfo = signal<any>(null);
  executingAction = signal(false);

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router,
    public notificationService: NotificationService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    this.currentUser.set(this.authService.user());
    if (this.isAdmin()) {
      this.loadAllUsers();
    }
    
    // Iniciar conexión de notificaciones
    await this.notificationService.startConnection();
  }

  async ngOnDestroy() {
    await this.notificationService.stopConnection();
  }



  loadAllUsers() {
    this.loading.set(true);
    this.adminService.getAllUsers().subscribe({
      next: (response) => {
        if (response.success) {
          // Ordenar: pendientes primero, luego por fecha
          const sortedUsers = response.data.sort((a: any, b: any) => {
            // Pendientes primero
            if (!a.isApproved && !a.isRejected && (b.isApproved || b.isRejected)) return -1;
            if ((a.isApproved || a.isRejected) && !b.isApproved && !b.isRejected) return 1;
            // Luego por fecha (más recientes primero)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          
          this.allUsers.set(sortedUsers);
          this.applyFilters();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando usuarios:', error);
        this.loading.set(false);
      }
    });
  }

  applyFilters() {
    let filtered = [...this.allUsers()];
    
    if (this.statusFilter) {
      if (this.statusFilter === UserStatus.PENDING) {
        filtered = filtered.filter(u => !u.isApproved && !u.isRejected);
      } else if (this.statusFilter === UserStatus.APPROVED) {
        filtered = filtered.filter(u => u.isApproved);
      } else if (this.statusFilter === UserStatus.REJECTED) {
        filtered = filtered.filter(u => u.isRejected);
      }
    }
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.firstName.toLowerCase().includes(term) || 
        u.lastName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    }
    
    this.filteredUsers.set(filtered);
    this.currentPage.set(1);
  }

  approveUser(userId: string) {
    const user = this.paginatedUsers().find(u => u.id === userId);
    this.pendingUserInfo.set(user);
    this.confirmMessage.set('¿Está seguro que desea aprobar este usuario?');
    this.confirmAction.set('approve');
    this.pendingUserId.set(userId);
    this.showConfirmDialog.set(true);
  }

  rejectUser(userId: string) {
    const user = this.paginatedUsers().find(u => u.id === userId);
    this.pendingUserInfo.set(user);
    this.confirmMessage.set('¿Está seguro que desea rechazar este usuario?');
    this.confirmAction.set('reject');
    this.pendingUserId.set(userId);
    this.showConfirmDialog.set(true);
  }

  executeConfirmation() {
    const userId = this.pendingUserId();
    if (!userId) return;

    this.executingAction.set(true);
    
    if (this.confirmAction() === 'approve') {
      this.approvingUser.set(userId);
      this.adminService.approveUser(userId).subscribe({
        next: (response) => {
          if (response.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Usuario Aprobado',
              detail: 'El usuario ha sido aprobado exitosamente'
            });
            this.loadAllUsers();
          }
          this.approvingUser.set(null);
          this.executingAction.set(false);
          this.showConfirmDialog.set(false);
        },
        error: (error) => {
          console.error('Error aprobando:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al aprobar el usuario'
          });
          this.approvingUser.set(null);
          this.executingAction.set(false);
          this.showConfirmDialog.set(false);
        }
      });
    } else {
      this.rejectingUser.set(userId);
      this.adminService.rejectUser(userId).subscribe({
        next: (response) => {
          if (response.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Usuario Rechazado',
              detail: 'El usuario ha sido rechazado exitosamente'
            });
            this.loadAllUsers();
          }
          this.rejectingUser.set(null);
          this.executingAction.set(false);
          this.showConfirmDialog.set(false);
        },
        error: (error) => {
          console.error('Error rechazando:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al rechazar el usuario'
          });
          this.rejectingUser.set(null);
          this.executingAction.set(false);
          this.showConfirmDialog.set(false);
        }
      });
    }
  }

  cancelConfirmation() {
    this.showConfirmDialog.set(false);
    this.pendingUserId.set(null);
    this.pendingUserInfo.set(null);
    this.executingAction.set(false);
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'U';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }

  getInitials(firstName: string, lastName: string): string {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  isAdmin(): boolean {
    const user = this.currentUser();
    return user?.role === 'Admin';
  }



  Math = Math;
  UserStatus = UserStatus;

  navigateToHome(): void {
    this.router.navigate(['/welcome']);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
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
}