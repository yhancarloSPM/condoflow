import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncidentCategoryOption, IncidentPriorityOption, IncidentStatusCounts, IncidentStatus } from '../models/incident.models';

@Component({
  selector: 'app-incident-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="row mb-4">
      <div class="col-md-3">
        <label class="form-label">Estado</label>
        <select class="form-select" [(ngModel)]="statusFilter" (ngModelChange)="onFilterChange()">
          <option value="">Todos los estados</option>
          <option [value]="IncidentStatus.REPORTED">Reportadas</option>
          <option [value]="IncidentStatus.IN_PROGRESS">En Proceso</option>
          <option [value]="IncidentStatus.RESOLVED">Resueltas</option>
          <option [value]="IncidentStatus.REJECTED">Rechazadas</option>
          <option [value]="IncidentStatus.CANCELLED">Canceladas</option>
        </select>
      </div>
      
      <div class="col-md-3">
        <label class="form-label">Prioridad</label>
        <select class="form-select" [(ngModel)]="priorityFilter" (ngModelChange)="onFilterChange()">
          <option value="">Todas las prioridades</option>
          <option *ngFor="let priority of priorities" [value]="priority.value">
            {{priority.label}}
          </option>
        </select>
      </div>
      
      <div class="col-md-3">
        <label class="form-label">Buscar</label>
        <input 
          type="text" 
          class="form-control" 
          placeholder="Buscar por título o propietario..."
          [(ngModel)]="searchTerm"
          (ngModelChange)="onFilterChange()"
        >
      </div>
      
      <div class="col-md-3">
        <!-- Columna vacía para mantener el layout -->
      </div>
    </div>
  `,
  styles: [`
    .form-select:focus, .form-control:focus {
      border-color: #ced4da !important;
      box-shadow: none !important;
    }
  `]
})
export class IncidentFiltersComponent {
  @Input() statusCounts!: IncidentStatusCounts;
  @Input() priorities!: IncidentPriorityOption[];
  @Output() filtersChanged = new EventEmitter<{status: string, priority: string, searchTerm: string}>();

  statusFilter = '';
  priorityFilter = '';
  searchTerm = '';
  
  IncidentStatus = IncidentStatus;

  onFilterChange(): void {
    this.filtersChanged.emit({
      status: this.statusFilter,
      priority: this.priorityFilter,
      searchTerm: this.searchTerm
    });
  }
}