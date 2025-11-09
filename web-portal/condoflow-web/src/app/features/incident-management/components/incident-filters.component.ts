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
          <option *ngFor="let status of statuses" [value]="status.value">
            {{status.label}}
          </option>
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
    
    .form-label {
      color: white !important;
      font-weight: 500;
    }
  `]
})
export class IncidentFiltersComponent {
  @Input() statusCounts!: IncidentStatusCounts;
  @Input() priorities!: IncidentPriorityOption[];
  @Input() statuses!: any[];
  @Output() filtersChanged = new EventEmitter<{status: string, priority: string, searchTerm: string}>();

  statusFilter = '';
  priorityFilter = '';
  searchTerm = '';

  onFilterChange(): void {
    this.filtersChanged.emit({
      status: this.statusFilter,
      priority: this.priorityFilter,
      searchTerm: this.searchTerm
    });
  }
}