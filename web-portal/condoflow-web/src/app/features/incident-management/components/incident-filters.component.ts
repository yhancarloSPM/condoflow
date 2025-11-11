import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncidentPriorityOption, IncidentStatusCounts, IncidentStatus } from '../models/incident.models';

@Component({
  selector: 'app-incident-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filters-section">
      <div class="d-flex gap-3 align-items-end flex-wrap">
        <div class="filter-group">
          <label class="filter-label">Estado</label>
          <select class="form-select filter-select" [(ngModel)]="statusFilter" (ngModelChange)="onFilterChange()">
            <option value="">Todos los estados</option>
            <option *ngFor="let status of statuses" [value]="status.value">
              {{status.label}}
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Prioridad</label>
          <select class="form-select filter-select" [(ngModel)]="priorityFilter" (ngModelChange)="onFilterChange()">
            <option value="">Todas las prioridades</option>
            <option *ngFor="let priority of priorities" [value]="priority.value">
              {{priority.label}}
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Período</label>
          <select class="form-select filter-select" [(ngModel)]="dateFilter" (ngModelChange)="onFilterChange()">
            <option value="">Todos los períodos</option>
            <option value="current-month">Este mes</option>
            <option value="last-3-months">Últimos 3 meses</option>
            <option value="last-6-months">Últimos 6 meses</option>
            <option value="current-year">Este año</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Buscar</label>
          <input 
            type="text" 
            class="form-control filter-input" 
            placeholder="Buscar por título o propietario..."
            [(ngModel)]="searchTerm"
            (ngModelChange)="onFilterChange()"
          >
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filters-section {
      margin-top: 1.5rem;
    }
    
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .filter-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
    }
    
    .filter-select {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 6px;
      color: white;
      padding: 0.75rem;
      font-size: 0.875rem;
      width: 300px;
      height: 48px;
      transition: all 0.2s ease;
    }
    
    .filter-input {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 6px;
      color: white;
      padding: 0.75rem;
      font-size: 0.875rem;
      width: 400px !important;
      min-width: 400px !important;
      max-width: none !important;
      height: 48px;
      transition: all 0.2s ease;
    }
    
    .filter-input::placeholder {
      color: white !important;
    }
    
    .filter-input:focus, .filter-select:focus {
      outline: none;
      border-color: rgba(255, 255, 255, 0.5);
      background: rgba(255, 255, 255, 0.15);
    }
    
    .filter-select option {
      background: #1e3c72;
      color: white;
    }
  `]
})
export class IncidentFiltersComponent {
  @Input() statusCounts!: IncidentStatusCounts;
  @Input() priorities!: IncidentPriorityOption[];
  @Input() statuses!: any[];
  @Output() filtersChanged = new EventEmitter<{status: string, priority: string, dateFilter: string, searchTerm: string}>();

  statusFilter = '';
  priorityFilter = '';
  dateFilter = '';
  searchTerm = '';

  onFilterChange(): void {
    this.filtersChanged.emit({
      status: this.statusFilter,
      priority: this.priorityFilter,
      dateFilter: this.dateFilter,
      searchTerm: this.searchTerm
    });
  }
}