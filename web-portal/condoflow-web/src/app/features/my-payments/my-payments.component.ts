import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { PaymentService } from '../../core/services/payment.service';
import { DebtService } from '../../core/services/debt.service';
import { NavbarComponent } from '../../shared/components/navbar.component';

@Component({
  selector: 'app-my-payments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NavbarComponent],
  templateUrl: './my-payments.component.html',
  styleUrls: ['./my-payments.component.scss']
})
export class MyPaymentsComponent implements OnInit {
  activeTab = 'payment';
  currentUser = signal<any>(null);
  payments = signal<any[]>([]);
  currentPage = signal(1);
  pageSize = 10;
  totalPages = signal(1);
  loading = signal(false);
  submitting = signal(false);
  availableDebts = signal<any[]>([]);
  allDebts: any[] = []; // Para almacenar todas las deudas y buscar por ID
  paymentConcepts = signal<any[]>([]);
  paymentForm: FormGroup;
  selectedFile: File | null = null;
  showMessage = signal(false);
  messageType = signal<'success' | 'error'>('success');
  messageText = signal('');
  paymentType = 'debt';
  selectedDebtId = '';
  preloadDebtId = '';
  preloadAmount = '';
  statusFilter = '';
  methodFilter = '';
  dateFromFilter = '';
  dateToFilter = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private debtService: DebtService
  ) {
    this.paymentForm = this.fb.group({
      concept: ['', Validators.required],
      amount: ['', Validators.required],
      paymentDate: ['', Validators.required],
      paymentMethod: ['', Validators.required]
    });
  }

  ngOnInit() {
    const user = this.authService.currentUser();
    console.log('Current user in MyPayments:', user);
    this.currentUser.set(user);
    
    this.paymentForm.patchValue({
      paymentDate: new Date().toISOString().split('T')[0]
    });
    
    if (user?.ownerId) {
      this.loadPaymentConcepts();
      this.loadAvailableDebts().then(() => {
        this.loadPayments();
      });
    } else {
      console.error('No owner ID found for user');
    }
  }

  isFormValid(): boolean {
    const hasFile = !!this.selectedFile;
    if (this.paymentType === 'debt') {
      return !!(this.selectedDebtId && 
               this.paymentForm.get('paymentDate')?.valid && 
               this.paymentForm.get('paymentMethod')?.valid &&
               hasFile);
    }
    return this.paymentForm.valid && hasFile;
  }

  loadPayments() {
    const user = this.currentUser();
    if (!user?.ownerId) return;
    
    this.loading.set(true);
    this.paymentService.getPayments(user.ownerId).subscribe({
      next: (response) => {
        if (response.success) {
          const allPayments = response.data.map((payment: any) => {
            let description = this.getConceptLabel(payment.concept);
            
            // Si es debt_payment, buscar la deuda asociada en allDebts
            if (payment.concept === 'debt_payment' && payment.debtId) {
              const associatedDebt = this.allDebts.find(debt => debt.id === payment.debtId);
              if (associatedDebt && associatedDebt.concept) {
                const monthMatch = associatedDebt.concept.match(/Mantenimiento (\w+) \d{4}/);
                if (monthMatch) {
                  description = `Pago Mantenimiento ${monthMatch[1]}`;
                }
              }
            }
            
            return {
              id: payment.id,
              description: description,
              amount: payment.amount,
              date: new Date(payment.paymentDate),
              createdAt: new Date(payment.createdAt),
              status: payment.status.toLowerCase(),
              paymentMethod: payment.paymentMethod,
              receiptUrl: payment.receiptUrl,
              rejectionReason: payment.rejectionReason
            };
          });
          
          this.allPayments = allPayments;
          this.applyFilters();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando pagos:', error);
        this.payments.set([]);
        this.loading.set(false);
      }
    });
  }

  loadPaymentConcepts() {
    const token = this.authService.getToken();
    const headers = { 'Authorization': `Bearer ${token}` };
    
    fetch('https://localhost:7009/api/payment-concepts', { headers })
      .then(response => response.json())
      .then(data => {
        console.log('Payment concepts response:', data);
        if (data.success) {
          // Filtrar solo conceptos que no sean maintenance
          const concepts = data.data.filter((c: any) => c.value !== 'maintenance');
          this.paymentConcepts.set(concepts);
        }
      })
      .catch(error => {
        console.error('Error cargando conceptos:', error);
        this.paymentConcepts.set([]);
      });
  }

  loadAvailableDebts(): Promise<void> {
    const user = this.currentUser();
    if (!user?.ownerId) return Promise.resolve();
    
    return new Promise((resolve) => {
      this.debtService.getDebts(user.ownerId).subscribe({
        next: (response) => {
          console.log('Debts response:', response);
          let debtsArray: any[] = [];
          if (response.success && response.data) {
            const currentDebts = response.data.currentDebts || [];
            const overdueDebts = response.data.overdueDebts || [];
            const paidDebts = response.data.paidDebts || [];
            const paymentSubmittedDebts = response.data.paymentSubmittedDebts || [];
            debtsArray = [...currentDebts, ...overdueDebts, ...paidDebts, ...paymentSubmittedDebts];
            console.log('All debts:', debtsArray);
          }
          
          // Almacenar todas las deudas para búsquedas
          this.allDebts = debtsArray;
          
          const activeDebts = debtsArray.filter((debt: any) => {
            const remaining = debt.remainingAmount || debt.RemainingAmount || debt.amount || debt.Amount || 0;
            const status = debt.status || debt.Status || 'Pending';
            console.log(`Debt ${debt.id}: remaining=${remaining}, status=${status}`);
            return remaining > 0 && status !== 'PaymentSubmitted' && status !== 'Paid';
          }).map((debt: any) => ({
            id: debt.id,
            concept: debt.concept,
            remainingAmount: debt.remainingAmount || debt.RemainingAmount || debt.amount || debt.Amount
          }));
          
          console.log('Active debts for select:', activeDebts);
          activeDebts.forEach(debt => {
            console.log(`Debt concept: "${debt.concept}", amount: ${debt.remainingAmount}`);
          });
          this.availableDebts.set(activeDebts);
          
          // Precargar deuda si viene de query params
          if (this.preloadDebtId) {
            this.selectedDebtId = this.preloadDebtId;
            this.paymentType = 'debt';
            if (this.preloadAmount) {
              this.paymentForm.patchValue({ amount: this.preloadAmount });
              this.paymentForm.get('amount')?.disable();
            }
            this.preloadDebtId = '';
            this.preloadAmount = '';
          }
          
          resolve();
        },
        error: (error) => {
          console.error('Error cargando deudas:', error);
          resolve();
        }
      });
    });
  }

  onPaymentTypeChange() {
    this.paymentForm.get('concept')?.setValue('');
    this.paymentForm.get('amount')?.setValue('');
    this.paymentForm.get('amount')?.enable();
    this.selectedDebtId = '';
  }

  onDebtSelected() {
    if (this.selectedDebtId) {
      const selectedDebt = this.availableDebts().find(d => d.id === this.selectedDebtId);
      if (selectedDebt) {
        this.paymentForm.get('amount')?.setValue(selectedDebt.remainingAmount);
        this.paymentForm.get('amount')?.disable();
      }
    } else {
      this.paymentForm.get('amount')?.setValue('');
      this.paymentForm.get('amount')?.enable();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.showErrorMessage('El archivo no puede ser mayor a 5MB.');
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        this.showErrorMessage('Formato no válido. Solo se permiten archivos JPG y PNG.');
        return;
      }
      
      this.selectedFile = file;
    }
  }

  onSubmitPayment() {
    if (this.isFormValid()) {
      this.submitting.set(true);
      
      const formData = new FormData();
      
      if (this.paymentType === 'debt') {
        formData.append('concept', 'debt_payment');
        formData.append('debtId', this.selectedDebtId);
      } else {
        formData.append('concept', this.paymentForm.get('concept')?.value);
      }
      
      const amountValue = this.paymentForm.get('amount')?.disabled ? 
        this.paymentForm.get('amount')?.value : this.paymentForm.get('amount')?.value;
      formData.append('amount', amountValue);
      formData.append('paymentDate', this.paymentForm.get('paymentDate')?.value);
      formData.append('paymentMethod', this.paymentForm.get('paymentMethod')?.value);
      formData.append('currency', 'DOP');
      if (this.selectedFile) {
        formData.append('receipt', this.selectedFile);
      }
      
      const user = this.currentUser();
      if (!user?.ownerId) {
        this.showErrorMessage('Error: No se pudo obtener el ID del propietario');
        this.submitting.set(false);
        return;
      }
      
      this.paymentService.createPayment(user.ownerId, formData).subscribe({
        next: (response) => {
          this.submitting.set(false);
          if (response.success) {
            this.showSuccessMessage(response.message);
            this.paymentForm.reset();
            this.paymentForm.patchValue({
              paymentDate: new Date().toISOString().split('T')[0]
            });
            this.selectedFile = null;
            this.selectedDebtId = '';
            this.paymentType = 'debt';
            const fileInput = document.getElementById('receipt') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            this.loadAvailableDebts().then(() => {
              this.loadPayments();
            });
          } else {
            this.showErrorMessage(response.message);
          }
        },
        error: (error) => {
          this.submitting.set(false);
          console.error('Error enviando pago:', error);
          console.error('Error details:', error.error);
          const errorMessage = error.error?.message || error.error?.errors || 'No se pudo procesar el pago.';
          this.showErrorMessage(errorMessage);
        }
      });
    } else {
      const paymentMethod = this.paymentForm.get('paymentMethod')?.value;
      const isReceiptRequired = paymentMethod !== 'cash';
      const message = isReceiptRequired ? 
        'Por favor completa todos los campos y selecciona un comprobante válido.' :
        'Por favor completa todos los campos requeridos.';
      this.showErrorMessage(message);
    }
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'U';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  getConceptLabel(concept: string): string {
    const conceptMap: { [key: string]: string } = {
      'maintenance': 'Pago de Mantenimiento',
      'advance': 'Pago Adelantado',
      'extraordinary': 'Cuota Extraordinaria',
      'fine': 'Multa',
      'debt_payment': 'Pago de Deuda',
      'other': 'Otro'
    };
    return conceptMap[concept] || concept;
  }

  navigateToHome(): void {
    this.router.navigate(['/welcome']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }

  viewReceipt(payment: any) {
    if (payment.id) {
      const token = this.authService.getToken();
      const url = `https://localhost:7009/api/receipts/${payment.id}?access_token=${token}`;
      window.open(url, '_blank');
    }
  }

  showSuccessMessage(message?: string) {
    this.messageType.set('success');
    this.messageText.set(message || '¡Pago enviado exitosamente!');
    this.showMessage.set(true);
    setTimeout(() => this.showMessage.set(false), 5000);
  }

  showErrorMessage(message: string) {
    this.messageType.set('error');
    this.messageText.set(message);
    this.showMessage.set(true);
    setTimeout(() => this.showMessage.set(false), 5000);
  }

  closeMessage() {
    this.showMessage.set(false);
  }

  triggerFileInput() {
    const fileInput = document.getElementById('receipt') as HTMLInputElement;
    fileInput?.click();
  }

  removeFile(event: Event) {
    event.stopPropagation();
    this.selectedFile = null;
    const fileInput = document.getElementById('receipt') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadPayments();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadPayments();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadPayments();
    }
  }

  Math = Math;

  filteredPayments = signal<any[]>([]);
  allPayments: any[] = [];

  applyFilters() {
    let filtered = [...this.allPayments];
    
    if (this.statusFilter) {
      filtered = filtered.filter(payment => payment.status === this.statusFilter);
    }
    
    if (this.methodFilter) {
      filtered = filtered.filter(payment => payment.paymentMethod === this.methodFilter);
    }
    
    if (this.dateFromFilter) {
      const fromDate = new Date(this.dateFromFilter);
      filtered = filtered.filter(payment => payment.date >= fromDate);
    }
    
    if (this.dateToFilter) {
      const toDate = new Date(this.dateToFilter);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(payment => payment.date <= toDate);
    }
    
    this.filteredPayments.set(filtered);
    const totalItems = filtered.length;
    this.totalPages.set(Math.ceil(totalItems / this.pageSize));
    this.currentPage.set(1);
    
    const paginatedPayments = filtered.slice(0, this.pageSize);
    this.payments.set(paginatedPayments);
  }

  hasActiveFilters(): boolean {
    return !!(this.statusFilter || this.methodFilter || this.dateFromFilter || this.dateToFilter);
  }

  clearFilters() {
    this.statusFilter = '';
    this.methodFilter = '';
    this.dateFromFilter = '';
    this.dateToFilter = '';
    this.applyFilters();
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.totalPages();
    const current = this.currentPage();
    
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
  }

  getMethodClass(method: string): string {
    const methodMap: { [key: string]: string } = {
      'Transferencia': 'transferencia',
      'Efectivo': 'efectivo', 
      'Cheque': 'cheque',
      'Tarjeta': 'tarjeta'
    };
    return methodMap[method] || 'transferencia';
  }

  getMethodIcon(method: string): string {
    const iconMap: { [key: string]: string } = {
      'Transferencia': 'pi-arrow-right-arrow-left',
      'Efectivo': 'pi-money-bill',
      'Cheque': 'pi-file-edit',
      'Tarjeta': 'pi-credit-card'
    };
    return iconMap[method] || 'pi-arrow-right-arrow-left';
  }
}