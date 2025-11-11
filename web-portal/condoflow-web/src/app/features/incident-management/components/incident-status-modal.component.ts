import { Component, EventEmitter, Input, Output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Incident, IncidentStatus, IncidentUpdateData } from '../models/incident.models';
import { IncidentUtilsService } from '../services/incident-utils.service';

@Component({
  selector: 'app-incident-status-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" *ngIf="show" (click)="closeModal()">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="pi pi-refresh me-2" [style.color]="getIconColor()"></i>
              Actualizar Estado
            </h5>
            <button type="button" class="btn-close" (click)="closeModal()">
              <i class="pi pi-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Nuevo Estado</label>
              <select class="form-select" [(ngModel)]="newStatus" (ngModelChange)="onStatusChange()">
                <option value="">Seleccionar estado...</option>
                @for (status of incidentStatuses(); track status.id) {
                  <option [value]="status.code">{{ status.name }}</option>
                }
              </select>
            </div>
            
            <div class="mb-3" *ngIf="newStatus === IncidentStatus.REJECTED">
              <label class="form-label">Motivo del Rechazo <span class="text-danger">*</span></label>
              <textarea 
                class="form-control" 
                rows="3" 
                [(ngModel)]="adminComment"
                placeholder="Explica el motivo del rechazo... (Obligatorio)"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary modal-btn" (click)="closeModal()">Cancelar</button>
            <button 
              type="button" 
              class="btn modal-btn" 
              [class]="'btn-outline-' + getButtonClass()"
              (click)="updateStatus()"
              [disabled]="!canUpdate() || updating()"
            >
              <span *ngIf="updating()" class="spinner-border spinner-border-sm me-2"></span>
              Actualizar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
    }

    .modal-dialog {
      max-width: 500px;
      width: 90%;
      word-wrap: break-word;
    }

    .modal-content {
      background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
      backdrop-filter: blur(15px);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 24px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
      color: white;
    }

    .modal-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.2);
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      border-top-left-radius: 24px;
      border-top-right-radius: 24px;
      color: white;
    }

    .modal-title {
      margin: 0;
      font-weight: 600;
      color: white;
    }

    .modal-body {
      padding: 1.5rem;
      color: white;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255,255,255,0.2);
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
      background: rgba(255,255,255,0.05);
      border-bottom-left-radius: 24px;
      border-bottom-right-radius: 24px;
    }

    .btn-close {
      background: rgba(255,255,255,0.2) !important;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      color: white;
      cursor: pointer;
    }

    .btn-close:hover {
      background: rgba(255,255,255,0.3) !important;
    }

    .form-label {
      color: white !important;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .form-control, .form-select {
      background: rgba(255, 255, 255, 0.1) !important;
      border: 1px solid rgba(255, 255, 255, 0.3) !important;
      border-radius: 10px !important;
      color: white !important;
      padding: 0.75rem 1rem;
    }

    .form-control:focus, .form-select:focus {
      background: rgba(255, 255, 255, 0.2) !important;
      border-color: rgba(255, 255, 255, 0.5) !important;
      box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.25) !important;
      color: white !important;
    }

    .form-control::placeholder {
      color: rgba(255, 255, 255, 0.6) !important;
    }

    .form-select option {
      background: #1e3c72;
      color: white;
    }

    .modal-btn {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid;
      min-width: 100px;
    }

    .btn-outline-secondary {
      background: transparent;
      border-color: #94a3b8;
      color: #94a3b8;
    }

    .btn-outline-secondary:hover:not(:disabled) {
      background: #94a3b8;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(148, 163, 184, 0.2);
    }

    .btn-outline-warning {
      background: transparent;
      border-color: #f59e0b;
      color: #f59e0b;
    }

    .btn-outline-warning:hover:not(:disabled) {
      background: #f59e0b;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
    }

    .btn-outline-info {
      background: transparent;
      border-color: #3b82f6;
      color: #3b82f6;
    }

    .btn-outline-info:hover:not(:disabled) {
      background: #3b82f6;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
    }

    .btn-outline-success {
      background: transparent;
      border-color: #10b981;
      color: #10b981;
    }

    .btn-outline-success:hover:not(:disabled) {
      background: #10b981;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
    }

    .btn-outline-danger {
      background: transparent;
      border-color: #ef4444;
      color: #ef4444;
    }

    .btn-outline-danger:hover:not(:disabled) {
      background: #ef4444;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
    }

    .btn-outline-warning:disabled,
    .btn-outline-info:disabled,
    .btn-outline-success:disabled,
    .btn-outline-danger:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .text-danger {
      color: #ff6b6b !important;
    }
  `]
})
export class IncidentStatusModalComponent implements OnInit {
  @Input() show = false;
  @Input() incident: Incident | null = null;
  @Output() statusUpdated = new EventEmitter<IncidentUpdateData>();
  @Output() modalClosed = new EventEmitter<void>();

  newStatus: IncidentStatus | '' = '';
  adminComment = '';
  updating = signal(false);
  incidentStatuses = signal<any[]>([]);
  
  IncidentStatus = IncidentStatus;

  constructor(private incidentUtils: IncidentUtilsService) {}

  ngOnInit() {
    this.loadIncidentStatuses();
  }

  private loadIncidentStatuses() {
    this.incidentUtils.getStatuses().subscribe({
      next: (statuses) => {
        // Filtrar solo los estados que se pueden cambiar desde el modal
        const editableStatuses = statuses.filter((status: any) => 
          ['reported', 'in_progress', 'resolved', 'rejected'].includes(status.code)
        );
        this.incidentStatuses.set(editableStatuses);
      },
      error: (error) => {
        console.error('Error loading incident statuses:', error);
        this.incidentStatuses.set([]);
      }
    });
  }

  onStatusChange(): void {
    if (this.newStatus !== IncidentStatus.REJECTED) {
      this.adminComment = '';
    }
  }

  canUpdate(): boolean {
    if (!this.newStatus) return false;
    if (this.newStatus === IncidentStatus.REJECTED && !this.adminComment.trim()) return false;
    return true;
  }

  updateStatus(): void {
    if (!this.canUpdate() || !this.newStatus) return;

    const updateData: IncidentUpdateData = {
      status: this.newStatus as IncidentStatus,
      adminComment: this.newStatus === IncidentStatus.REJECTED ? this.adminComment : undefined
    };

    this.statusUpdated.emit(updateData);
  }

  closeModal(): void {
    this.newStatus = '';
    this.adminComment = '';
    this.modalClosed.emit();
  }

  setUpdating(value: boolean): void {
    this.updating.set(value);
  }

  getIconColor(): string {
    if (!this.incident) return '#06b6d4';
    
    switch (this.incident.status) {
      case 'reported':
        return '#f59e0b'; // warning - amarillo/naranja
      case 'in_progress':
        return '#3b82f6'; // info - azul
      case 'resolved':
        return '#10b981'; // success - verde
      case 'rejected':
        return '#ef4444'; // danger - rojo
      default:
        return '#6b7280'; // secondary - gris
    }
  }

  getButtonClass(): string {
    if (!this.incident) return 'secondary';
    
    switch (this.incident.status) {
      case 'reported':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'resolved':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  }
}