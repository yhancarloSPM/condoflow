import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CatalogItem {
  code: string;
  name: string;
  description?: string;
}

interface FilterData {
  statusFilter: string;
  eventTypeFilter: string;
  searchTerm: string;
}

@Component({
  selector: 'app-reservation-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="row mb-4">
      <div class="col-md-3">
        <label class="form-label">Estado</label>
        <select class="form-select" [(ngModel)]="filters.statusFilter" (ngModelChange)="onFiltersChange()">
          <option value="">Todos los estados</option>
          @for (status of reservationStatuses; track status.code) {
            <option [value]="status.code">{{ status.name }}</option>
          }
        </select>
      </div>
      
      <div class="col-md-3">
        <label class="form-label">Tipo de Evento</label>
        <select class="form-select" [(ngModel)]="filters.eventTypeFilter" (ngModelChange)="onFiltersChange()">
          <option value="">Todos los tipos</option>
          @for (eventType of eventTypes; track eventType.code) {
            <option [value]="eventType.code">{{ eventType.name }}</option>
          }
        </select>
      </div>
      
      <div class="col-md-3">
        <label class="form-label">Buscar</label>
        <input 
          type="text" 
          class="form-control" 
          placeholder="Buscar por propietario..."
          [(ngModel)]="filters.searchTerm"
          (ngModelChange)="onFiltersChange()"
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
export class ReservationFiltersComponent {
  @Input() reservationStatuses: CatalogItem[] = [];
  @Input() eventTypes: CatalogItem[] = [];
  @Input() filters: FilterData = {
    statusFilter: '',
    eventTypeFilter: '',
    searchTerm: ''
  };
  
  @Output() filtersChange = new EventEmitter<FilterData>();

  onFiltersChange() {
    this.filtersChange.emit(this.filters);
  }
}