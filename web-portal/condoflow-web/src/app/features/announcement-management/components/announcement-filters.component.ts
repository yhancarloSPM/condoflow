import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnnouncementFilters, AnnouncementType } from '../models/announcement.models';

@Component({
  selector: 'app-announcement-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="row mb-4">
      <div class="col-md-4">
        <label class="form-label">Tipo de Comunicado</label>
        <select class="form-select" [(ngModel)]="filters.type" (ngModelChange)="onFiltersChange()">
          <option value="">Todos los tipos</option>
          <option value="urgent">Urgentes</option>
          <option value="event">Eventos</option>
          <option value="info">Informativos</option>
        </select>
      </div>
      
      <div class="col-md-4">
        <label class="form-label">Buscar</label>
        <input 
          type="text" 
          class="form-control" 
          placeholder="Buscar por título o contenido..."
          [(ngModel)]="filters.searchTerm"
          (ngModelChange)="onFiltersChange()"
        >
      </div>
      
      <div class="col-md-4">
        <!-- Columna vacía para mantener el layout -->
      </div>
    </div>
  `,
  styles: [`
    .form-select, .form-control {
      background: rgba(255,255,255,0.1) !important;
      border: 1px solid rgba(255,255,255,0.3) !important;
      color: white !important;
    }
    
    .form-select:focus, .form-control:focus {
      background: rgba(255,255,255,0.2) !important;
      border-color: rgba(255,255,255,0.5) !important;
      box-shadow: none !important;
      color: white !important;
    }
    
    .form-select option {
      background: #1e3c72 !important;
      color: white !important;
    }
    
    .form-label {
      color: white !important;
      font-weight: 500;
    }
    
    .form-control::placeholder {
      color: white !important;
    }
  `]
})
export class AnnouncementFiltersComponent {
  @Input() filters: AnnouncementFilters = {
    type: '',
    searchTerm: ''
  };
  
  @Output() filtersChange = new EventEmitter<AnnouncementFilters>();

  onFiltersChange() {
    this.filtersChange.emit(this.filters);
  }
}