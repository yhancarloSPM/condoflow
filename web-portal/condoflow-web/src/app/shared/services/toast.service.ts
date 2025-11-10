import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  showSuccess(message: string): void {
    this.showToast(message, '#10B981', 'pi-check-circle');
  }

  showError(message: string): void {
    this.showToast(message, '#EF4444', 'pi-times-circle');
  }

  private showToast(message: string, backgroundColor: string, icon: string): void {
    const toast = document.createElement('div');
    toast.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; background: ${backgroundColor}; color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; font-weight: 500;">
        <i class="pi ${icon}" style="margin-right: 0.5rem;"></i>
        ${message}
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 3000);
  }
}