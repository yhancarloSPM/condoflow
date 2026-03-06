import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (totalPages() > 1) {
      <div class="pagination-container">
        <div class="pagination-info">
          <small class="text-white">
            Mostrando {{ startIndex() }} - {{ endIndex() }} de {{ totalItems }} {{ itemLabel }}
          </small>
        </div>
        <div class="pagination">
          <button 
            class="pagination-btn"
            (click)="onPageChange(currentPage - 1)"
            [disabled]="currentPage === 1">
            <i class="pi pi-chevron-left"></i>
          </button>
          
          @for (page of pageNumbers(); track page) {
            @if (page === '...') {
              <span class="pagination-dots">...</span>
            } @else if (isNumber(page)) {
              <button 
                class="pagination-btn"
                [class.active]="page === currentPage"
                (click)="onPageChange(page)">
                {{ page }}
              </button>
            }
          }
          
          <button 
            class="pagination-btn"
            (click)="onPageChange(currentPage + 1)"
            [disabled]="currentPage === totalPages()">
            <i class="pi pi-chevron-right"></i>
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .pagination-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      border-top: 1px solid rgba(255,255,255,0.2);
      margin-top: 1rem;
    }

    .pagination-info {
      color: rgba(255, 255, 255, 0.9);
    }

    .pagination {
      display: flex;
      gap: 0.5rem;
    }

    .pagination-btn {
      color: white !important;
      border-color: rgba(255,255,255,0.3) !important;
      background: rgba(255,255,255,0.1) !important;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.875rem;
      min-width: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid;

      &:hover:not(:disabled) {
        background: rgba(255,255,255,0.2) !important;
        color: white !important;
      }

      &.active {
        background: rgba(255,255,255,0.3) !important;
        color: white !important;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .pagination-dots {
      color: rgba(255,255,255,0.8) !important;
      padding: 0.5rem 0.75rem;
      font-weight: 500;
    }
  `]
})
export class PaginationComponent {
  @Input() currentPage: number = 1;
  @Input() totalItems: number = 0;
  @Input() pageSize: number = 10;
  @Input() itemLabel: string = 'items';
  @Output() pageChange = new EventEmitter<number>();

  totalPages = computed(() => Math.ceil(this.totalItems / this.pageSize));
  
  startIndex = computed(() => {
    return (this.currentPage - 1) * this.pageSize + 1;
  });

  endIndex = computed(() => {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  });

  pageNumbers = computed(() => {
    const pages: (number | string)[] = [];
    const total = this.totalPages();
    const current = this.currentPage;
    
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
  });

  isNumber(value: number | string): value is number {
    return typeof value === 'number';
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageChange.emit(page);
    }
  }
}
