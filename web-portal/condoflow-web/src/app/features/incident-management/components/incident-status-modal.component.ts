import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Incident, IncidentStatus, IncidentUpdateData } from '../models/incident.models';

@Component({
  selector: 'app-incident-status-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal fade show d-flex align-items-center justify-content-center" style="display: block; background: rgba(0,0,0,0.5);" *ngIf="show">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header custom-header">
            <h5 class="modal-title"><i class="pi pi-pencil me-2"></i>Actualizar Estado</h5>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Nuevo Estado</label>
              <select class="form-select" [(ngModel)]="newStatus" (ngModelChange)="onStatusChange()" style="border: 1px solid #ced4da;">
                <option value="">Seleccionar estado...</option>
                <option [value]="IncidentStatus.IN_PROGRESS">En Proceso</option>
                <option [value]="IncidentStatus.RESOLVED">Resuelta</option>
                <option [value]="IncidentStatus.REJECTED">Rechazada</option>
              </select>
            </div>
            
            <div class="mb-3" *ngIf="newStatus === IncidentStatus.REJECTED">
              <label class="form-label">Motivo del Rechazo <span class="text-danger">*</span></label>
              <textarea 
                class="form-control" 
                rows="3" 
                [(ngModel)]="adminComment"
                placeholder="Explica el motivo del rechazo... (Obligatorio)"
                style="border: 1px solid #ced4da;"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" (click)="closeModal()">Cancelar</button>
            <button 
              type="button" 
              class="btn btn-outline-warning custom-orange-btn" 
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
    .form-select:focus, .form-control:focus {
      border-color: #ced4da !important;
      box-shadow: none !important;
    }
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    .modal-dialog {
      max-width: 500px;
      width: 90%;
      margin: 0;
    }
    .custom-orange-btn {
      border-color: #f97316 !important;
      color: #f97316 !important;
    }
    .custom-orange-btn:hover:not(:disabled) {
      background-color: #f97316 !important;
      border-color: #f97316 !important;
      color: white !important;
    }
    .custom-orange-btn:focus {
      box-shadow: 0 0 0 0.2rem rgba(249, 115, 22, 0.25) !important;
    }
    .custom-header {
      background-color: #f97316 !important;
      border-bottom: 1px solid #f97316 !important;
    }
    .custom-header .modal-title {
      color: white !important;
    }
    .custom-header .btn-close {
      filter: brightness(0) invert(1);
    }
  `]
})
export class IncidentStatusModalComponent {
  @Input() show = false;
  @Input() incident: Incident | null = null;
  @Output() statusUpdated = new EventEmitter<IncidentUpdateData>();
  @Output() modalClosed = new EventEmitter<void>();

  newStatus: IncidentStatus | '' = '';
  adminComment = '';
  updating = signal(false);
  
  IncidentStatus = IncidentStatus;

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
}