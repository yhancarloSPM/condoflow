import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';


interface Poll {
  id: number;
  title: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isAnonymous: boolean;
  showResults: boolean;
  quorumRequired?: number;
  allowOther?: boolean;
  createdBy: string;
  createdAt: string;
  options: PollOption[];
  stats: PollStats;
  hasUserVoted: boolean;
  userVoteOptionId?: number;
  userVoteOptionIds: number[];
}

interface PollOption {
  id: number;
  text: string;
  voteCount: number;
  percentage: number;
  voters: Voter[];
}

interface Voter {
  ownerName: string;
  apartment: string;
  votedAt: string;
}

interface PollStats {
  totalVotes: number;
  totalUsers: number;
  participationRate: number;
  hasQuorum: boolean;
  status: string;
}

interface CreatePoll {
  title: string;
  description: string;
  type: number;
  startDate: string;
  endDate: string;
  isAnonymous: boolean;
  showResults: boolean;
  quorumRequired?: number;
  options: string[];
}

@Component({
  selector: 'app-polls',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, ToastModule],
  providers: [MessageService],
  templateUrl: './polls.component.html',
  styleUrls: ['./polls.component.scss']
})
export class PollsComponent implements OnInit {
  polls = signal<Poll[]>([]);
  loading = signal(false);
  showCreateModal = signal(false);
  selectedPoll = signal<Poll | null>(null);
  showDeleteModal = signal(false);
  showCloseModal = signal(false);
  pollToDelete = signal<Poll | null>(null);
  pollToClose = signal<Poll | null>(null);
  selectedOptions: number[] = [];
  customOptionText = '';
  customOptionSelected = false;
  currentPage = 1;
  pollsPerPage = 3;
  
  newPoll: CreatePoll & { allowOther?: boolean } = {
    title: '',
    description: '',
    type: 0, // Simple
    startDate: '',
    endDate: '',
    isAnonymous: false,
    showResults: true,
    quorumRequired: undefined,
    options: ['', ''],
    allowOther: false
  };
  
  isEditing = signal(false);
  editingPollId: number | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadPolls();
  }

  loadPolls() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/polls`).subscribe({
      next: (response) => {
        if (response.success) {
          this.polls.set(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading polls:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar las encuestas'
        });
        this.loading.set(false);
      }
    });
  }

  openCreateModal() {
    this.resetForm();
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
    this.resetForm();
  }

  resetForm() {
    this.newPoll = {
      title: '',
      description: '',
      type: 0,
      startDate: '',
      endDate: '',
      isAnonymous: false,
      showResults: true,
      quorumRequired: undefined,
      options: ['', ''],
      allowOther: false
    };
    this.isEditing.set(false);
    this.editingPollId = null;
  }

  addOption() {
    this.newPoll.options.push('');
  }

  removeOption(index: number) {
    if (this.newPoll.options.length > 2) {
      this.newPoll.options.splice(index, 1);
    }
  }

  createPoll() {
    if (!this.validateForm()) return;

    this.loading.set(true);
    
    const request = this.isEditing() 
      ? this.http.put<any>(`${environment.apiUrl}/polls/${this.editingPollId}`, this.newPoll)
      : this.http.post<any>(`${environment.apiUrl}/polls`, this.newPoll);
    
    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.loadPolls();
          this.closeCreateModal();
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: this.isEditing() ? 'Encuesta actualizada exitosamente.' : 'Encuesta creada exitosamente.'
          });
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error saving poll:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al guardar la encuesta. Inténtalo de nuevo.'
        });
        this.loading.set(false);
      }
    });
  }

  validateForm(): boolean {
    if (!this.newPoll.title.trim() || !this.newPoll.description.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Título y descripción son requeridos'
      });
      return false;
    }

    if (!this.newPoll.startDate || !this.newPoll.endDate) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Fechas de inicio y fin son requeridas'
      });
      return false;
    }

    if (new Date(this.newPoll.endDate) <= new Date(this.newPoll.startDate)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'La fecha de fin debe ser posterior a la fecha de inicio'
      });
      return false;
    }

    const validOptions = this.newPoll.options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Debe tener al menos 2 opciones válidas'
      });
      return false;
    }

    this.newPoll.options = validOptions;
    return true;
  }

  vote(poll: Poll, optionId: number) {
    this.http.post<any>(`${environment.apiUrl}/polls/${poll.id}/vote`, { optionId }).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadPolls();
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Voto registrado correctamente'
          });
        }
      },
      error: (error) => {
        console.error('Error voting:', error);
        const errorMsg = error.error?.message || 'Error al votar. Inténtalo de nuevo.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMsg
        });
      }
    });
  }

  closePoll(poll: Poll) {
    this.pollToClose.set(poll);
    this.showCloseModal.set(true);
  }

  confirmClosePoll() {
    const poll = this.pollToClose();
    if (!poll) return;

    this.http.put<any>(`${environment.apiUrl}/polls/${poll.id}/close`, {}).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadPolls();
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Encuesta cerrada correctamente'
          });
        }
        this.closeCloseModal();
      },
      error: (error) => {
        console.error('Error closing poll:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cerrar la encuesta'
        });
        this.closeCloseModal();
      }
    });
  }

  closeCloseModal() {
    this.showCloseModal.set(false);
    this.pollToClose.set(null);
  }

  deletePoll(poll: Poll) {
    this.pollToDelete.set(poll);
    this.showDeleteModal.set(true);
  }

  confirmDeletePoll() {
    const poll = this.pollToDelete();
    if (!poll) return;

    this.http.delete<any>(`${environment.apiUrl}/polls/${poll.id}`).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadPolls();
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Encuesta eliminada correctamente'
          });
        }
        this.closeDeleteModal();
      },
      error: (error) => {
        console.error('Error deleting poll:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al eliminar la encuesta'
        });
        this.closeDeleteModal();
      }
    });
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.pollToDelete.set(null);
  }



  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  navigateToHome() {
    this.router.navigate(['/welcome']);
  }
  
  isAdmin(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.role === 'Admin';
  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  trackByIndex(index: number): number {
    return index;
  }

  toggleMultipleOption(optionId: number, event: any) {
    if (event.target.checked) {
      if (!this.selectedOptions.includes(optionId)) {
        this.selectedOptions.push(optionId);
      }
    } else {
      this.selectedOptions = this.selectedOptions.filter(id => id !== optionId);
    }
  }

  submitMultipleVote(poll: Poll) {
    if (this.selectedOptions.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Debe seleccionar al menos una opción'
      });
      return;
    }

    this.http.post<any>(`${environment.apiUrl}/polls/${poll.id}/vote-multiple`, { 
      optionIds: this.selectedOptions 
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.selectedOptions = [];
          this.loadPolls();
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Votos registrados correctamente'
          });
        }
      },
      error: (error) => {
        const errorMsg = error.error?.message || 'Error al votar. Inténtalo de nuevo.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMsg
        });
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.polls().length / this.pollsPerPage);
  }

  paginatedPolls() {
    const start = (this.currentPage - 1) * this.pollsPerPage;
    const end = start + this.pollsPerPage;
    return this.polls().slice(start, end);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.pollsPerPage;
  }

  getEndIndex(): number {
    const end = this.currentPage * this.pollsPerPage;
    return Math.min(end, this.polls().length);
  }

  editPoll(poll: Poll) {
    this.isEditing.set(true);
    this.editingPollId = poll.id;
    this.newPoll = {
      title: poll.title,
      description: poll.description,
      type: poll.type === 'Simple' ? 0 : 1,
      startDate: poll.startDate.slice(0, 16),
      endDate: poll.endDate.slice(0, 16),
      isAnonymous: poll.isAnonymous,
      showResults: poll.showResults,
      quorumRequired: poll.quorumRequired,
      options: poll.options.map(opt => opt.text),
      allowOther: poll.allowOther || false
    };
    this.showCreateModal.set(true);
  }

  getVisiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1);
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1);
        pages.push(total);
      }
    }

    return pages;
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Active':
        return 'pi-check-circle';
      case 'Closed':
        return 'pi-times-circle';
      case 'Pending':
        return 'pi-clock';
      default:
        return 'pi-circle';
    }
  }

  toggleCustomOption(event: any) {
    this.customOptionSelected = event.target.checked;
    if (!this.customOptionSelected) {
      this.customOptionText = '';
    }
  }

  voteCustom(poll: Poll) {
    if (!this.customOptionText?.trim()) return;
    
    this.http.post<any>(`${environment.apiUrl}/polls/${poll.id}/vote-custom`, { 
      customText: this.customOptionText.trim() 
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Voto registrado',
            detail: 'Tu voto personalizado ha sido registrado exitosamente'
          });
          this.customOptionText = '';
          this.loadPolls();
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Error al registrar el voto'
        });
      }
    });
  }
}