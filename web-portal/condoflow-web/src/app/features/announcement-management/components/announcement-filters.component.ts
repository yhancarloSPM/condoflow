import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnnouncementFilters, AnnouncementType } from '../models/announcement.models';

@Component({
  selector: 'app-announcement-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex gap-3 align-items-end flex-wrap">
      <div class="filter-group">
        <label class="filter-label">Buscar</label>
        <input 
          type="text" 
          class="filter-input" 
          placeholder="Buscar por título o contenido..."
          [(ngModel)]="filters.searchTerm"
          (ngModelChange)="onFiltersChange()"
        >
      </div>
      
      <div class="filter-group">
        <label class="filter-label">Tipo de Comunicado</label>
        <select class="filter-select" [(ngModel)]="filters.type" (ngModelChange)="onFiltersChange()">
          <option value="">Todos los tipos</option>
          <option value="urgent">Urgentes</option>
          <option value="event">Eventos</option>
          <option value="info">Informativos</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label class="filter-label">Período</label>
        <select class="filter-select" [(ngModel)]="filters.dateFilter" (ngModelChange)="onFiltersChange()">
          <option value="">Todos los períodos</option>
          <option value="current-month">Este mes</option>
          <option value="last-3-months">Últimos 3 meses</option>
          <option value="last-6-months">Últimos 6 meses</option>
          <option value="current-year">Este año</option>
        </select>
      </div>
    </div>
  `,
  styles: [`
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
export class AnnouncementFiltersComponent {
  @Input() filters: AnnouncementFilters = {
    type: '',
    dateFilter: '',
    searchTerm: ''
  };
  
  @Output() filtersChange = new EventEmitter<AnnouncementFilters>();

  onFiltersChange() {
    this.filtersChange.emit(this.filters);
  }
}