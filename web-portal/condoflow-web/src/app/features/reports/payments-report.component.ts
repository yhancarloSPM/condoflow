import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { AdminPaymentService } from '../../core/services/admin-payment.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import * as ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-payments-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './payments-report.component.html',
  styleUrls: ['./payments-report.component.scss']
})
export class PaymentsReportComponent implements OnInit {
  currentUser = signal<any>(null);
  loading = signal(false);
  exportLoading = signal(false);
  payments = signal<any[]>([]);
  owners = signal<any[]>([]);
  selectedOwnerName = signal('');

  selectedBlock = signal<string>('');
  selectedApartment = signal<string>('');

  blocks = signal<string[]>([]);
  apartments = signal<string[]>([]);
  currentPage = signal(1);
  itemsPerPage = 10;
  Math = Math;

  constructor(
    private authService: AuthService,
    private router: Router,
    private adminPaymentService: AdminPaymentService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const user = this.authService.currentUser();
    this.currentUser.set(user);
    
    if (!user || user.role !== 'Admin') {
      this.router.navigate(['/auth']);
      return;
    }
    
    this.loadPayments();
    this.loadBlocks();
  }

  loadPayments() {
    this.loading.set(true);
    this.adminPaymentService.getAllPayments().subscribe({
      next: (response) => {
        console.log('Payments response:', response);
        if (response.success) {
          console.log('Payments data:', response.data);
          this.payments.set(response.data);
          this.extractOwnersFromPayments();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading payments:', error);
        this.payments.set([]);
        this.loading.set(false);
      }
    });
  }

  updateOwnerName(event: any) {
    this.selectedOwnerName.set(event.target.value);
    this.currentPage.set(1);
  }

  extractOwnersFromPayments() {
    // Ya no necesitamos extraer owners para el select
    this.extractBlocksAndApartments();
  }

  extractBlocksAndApartments() {
    const blocksSet = new Set<string>();
    const apartmentsSet = new Set<string>();
    
    this.payments().forEach(payment => {
      const apt = payment.apartment || payment.Apartment || '';
      let ownerName = payment.ownerName || '';
      let apartmentFromName = '';
      
      if (ownerName.includes(' | ')) {
        const parts = ownerName.split(' | ');
        apartmentFromName = parts[1] || '';
      }
      
      const finalApartment = apt || apartmentFromName;
      const apartmentParts = finalApartment.toString().split('-');
      
      if (apartmentParts.length > 1) {
        const aptNumber = apartmentParts[1];
        if (aptNumber) apartmentsSet.add(aptNumber);
      } else if (finalApartment) {
        apartmentsSet.add(finalApartment);
      }
    });
    
    this.apartments.set(Array.from(apartmentsSet).sort());
  }

  filteredPayments = computed(() => {
    const filtered = this.getFilteredData();
    const totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    return {
      data: filtered.slice(startIndex, startIndex + this.itemsPerPage),
      totalPages,
      totalCount: filtered.length
    };
  });

  private getFilteredData() {
    // Solo mostrar pagos aprobados en el reporte
    let filtered = this.payments().filter(p => p.status.toLowerCase() === 'approved');
    
    if (this.selectedOwnerName()) {
      filtered = filtered.filter(p => {
        let ownerName = p.ownerName || '';
        if (ownerName.includes(' | ')) {
          ownerName = ownerName.split(' | ')[0];
        }
        return ownerName.toLowerCase().includes(this.selectedOwnerName().toLowerCase());
      });
    }
    
    if (this.selectedBlock() || this.selectedApartment()) {
      filtered = filtered.filter(p => {
        const apt = p.apartment || p.Apartment || '';
        let ownerName = p.ownerName || '';
        let apartmentFromName = '';
        
        if (ownerName.includes(' | ')) {
          const parts = ownerName.split(' | ');
          apartmentFromName = parts[1] || '';
        }
        
        const finalApartment = apt || apartmentFromName;
        const apartmentParts = finalApartment.toString().split('-');
        const paymentBlock = apartmentParts.length > 1 ? apartmentParts[0] : '';
        const paymentApt = apartmentParts.length > 1 ? apartmentParts[1] : finalApartment;
        
        let matches = true;
        if (this.selectedBlock()) matches = matches && paymentBlock === this.selectedBlock();
        if (this.selectedApartment()) matches = matches && paymentApt === this.selectedApartment();
        
        return matches;
      });
    }
    

    
    return filtered;
  }

  getPaymentStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'approved': 'Aprobado', 
      'rejected': 'Rechazado'
    };
    return statusMap[status.toLowerCase()] || status;
  }

  generateExcel() {
    this.exportLoading.set(true);
    setTimeout(async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Pagos');
      const currentDate = new Date().toLocaleDateString('es-ES');
      
      // Título
      worksheet.mergeCells('A1:I1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'CONDOFLOW - REPORTE DE PAGOS';
      titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Fecha
      worksheet.mergeCells('A2:I2');
      const dateCell = worksheet.getCell('A2');
      dateCell.value = `Fecha de generación: ${currentDate}`;
      dateCell.font = { size: 12, italic: true, bold: true };
      dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E5E7EB' } };
      dateCell.alignment = { horizontal: 'center' };
      
      // Headers
      const headers = ['Fecha de Pago', 'Propietario', 'Bloque', 'Apartamento', 'Monto', 'Método de Pago', 'Concepto', 'Estado', 'Fecha Procesamiento'];
      worksheet.getRow(4).values = headers;
      worksheet.getRow(4).font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
      worksheet.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } };
      
      // Datos
      let rowIndex = 5;
      this.getFilteredData().forEach(payment => {
        const row = worksheet.getRow(rowIndex);
        let ownerName = payment.ownerName || '';
        let apartmentFromName = '';
        
        if (ownerName.includes(' | ')) {
          const parts = ownerName.split(' | ');
          ownerName = parts[0];
          apartmentFromName = parts[1] || '';
        }
        
        const finalApartment = payment.apartment || payment.Apartment || apartmentFromName;
        const apartmentParts = finalApartment.toString().split('-');
        const finalBlock = apartmentParts.length > 1 ? apartmentParts[0] : '';
        const finalAptNumber = apartmentParts.length > 1 ? apartmentParts[1] : finalApartment;
        
        const processedDate = payment.processedAt || payment.ProcessedAt || payment.updatedAt || payment.UpdatedAt;
        
        row.values = [
          new Date(payment.paymentDate).toLocaleDateString('es-ES'),
          ownerName,
          finalBlock,
          finalAptNumber,
          payment.amount,
          payment.paymentMethod,
          payment.concept || '',
          this.getPaymentStatusText(payment.status),
          processedDate ? new Date(processedDate).toLocaleDateString('es-ES') : ''
        ];
        
        rowIndex++;
      });
      
      // Anchos de columna
      worksheet.columns = [
        { width: 16 }, { width: 40 }, { width: 8 }, { width: 12 },
        { width: 12 }, { width: 18 }, { width: 35 }, { width: 12 }, { width: 16 }
      ];
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Pagos_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      this.exportLoading.set(false);
    }, 500);
  }

  generatePDF() {
    this.exportLoading.set(true);
    setTimeout(() => {
      const doc = new jsPDF();
      const currentDate = new Date().toLocaleDateString('es-ES');
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('CONDOFLOW - REPORTE DE PAGOS', 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha de generación: ${currentDate}`, 105, 30, { align: 'center' });
      
      const data = this.getFilteredData().map(payment => {
        let ownerName = payment.ownerName || '';
        if (ownerName.includes(' | ')) {
          ownerName = ownerName.split(' | ')[0];
        }
        
        const finalApartment = payment.apartment || payment.Apartment || '';
        const apartmentParts = finalApartment.toString().split('-');
        const finalBlock = apartmentParts.length > 1 ? apartmentParts[0] : '';
        const finalAptNumber = apartmentParts.length > 1 ? apartmentParts[1] : finalApartment;
        
        return [
          new Date(payment.paymentDate).toLocaleDateString('es-ES'),
          ownerName,
          finalBlock,
          finalAptNumber,
          payment.amount,
          payment.paymentMethod,
          this.getPaymentStatusText(payment.status)
        ];
      });
      
      autoTable(doc, {
        head: [['Fecha', 'Propietario', 'Bloque', 'Apt', 'Monto', 'Método', 'Estado']],
        body: data,
        startY: 40,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 }
      });
      
      doc.save(`Reporte_Pagos_${new Date().toISOString().split('T')[0]}.pdf`);
      this.exportLoading.set(false);
    }, 500);
  }

  goBack() {
    this.router.navigate(['/reports']);
  }

  getBlock(payment: any): string {
    const apt = payment.apartment || payment.Apartment || '';
    let ownerName = payment.ownerName || '';
    let apartmentFromName = '';
    
    if (ownerName.includes(' | ')) {
      const parts = ownerName.split(' | ');
      apartmentFromName = parts[1] || '';
    }
    
    const finalApartment = apt || apartmentFromName;
    const apartmentParts = finalApartment.toString().split('-');
    return apartmentParts.length > 1 ? apartmentParts[0] : '';
  }

  getApartmentNumber(payment: any): string {
    const apt = payment.apartment || payment.Apartment || '';
    let ownerName = payment.ownerName || '';
    let apartmentFromName = '';
    
    if (ownerName.includes(' | ')) {
      const parts = ownerName.split(' | ');
      apartmentFromName = parts[1] || '';
    }
    
    const finalApartment = apt || apartmentFromName;
    const apartmentParts = finalApartment.toString().split('-');
    return apartmentParts.length > 1 ? apartmentParts[1] : finalApartment;
  }

  loadBlocks(): void {
    this.http.get<any>(`${this.authService.getApiUrl()}/blocks`).subscribe({
      next: (response) => {
        if (response.success) {
          const blocksData = response.data.map((block: any) => block.name);
          this.blocks.set(blocksData);
        }
      },
      error: () => {
        this.blocks.set(['Q', 'P', 'N', 'M', 'O']);
      }
    });
  }

  onBlockChange(): void {
    this.selectedApartment.set('');
    
    if (this.selectedBlock()) {
      this.http.get<any>(`${this.authService.getApiUrl()}/apartments/by-block/${this.selectedBlock()}`).subscribe({
        next: (response) => {
          if (response.success) {
            const apartmentsData = response.data.map((apt: any) => apt.number);
            this.apartments.set(apartmentsData);
          }
        },
        error: () => {
          this.apartments.set([]);
        }
      });
    } else {
      this.apartments.set([]);
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.filteredPayments().totalPages) {
      this.currentPage.set(page);
    }
  }




}