import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { AdminDebtService } from '../../core/services/admin-debt.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import * as ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-morosity-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './morosity-report.component.html',
  styleUrls: ['./morosity-report.component.scss'],
})
export class MorosityReportComponent implements OnInit {
  currentUser = signal<any>(null);
  loading = signal(false);
  exportLoading = signal(false);
  debts = signal<any[]>([]);
  owners = signal<any[]>([]);
  selectedOwnerName = signal('');
  selectedBlock = signal<string>('');
  selectedApartment = signal<string>('');
  selectedYear = signal<string>('');
  selectedMonth = signal<string>('');
  blocks = signal<string[]>([]);
  apartments = signal<string[]>([]);
  years = signal<string[]>([]);
  months = signal<string[]>([]);
  currentPage = signal(1);
  itemsPerPage = 10;
  Math = Math;

  constructor(
    private authService: AuthService,
    private router: Router,
    private adminDebtService: AdminDebtService,
    private http: HttpClient
  ) { }

  ngOnInit() {
    const user = this.authService.currentUser();
    this.currentUser.set(user);

    if (!user || user.role !== 'Admin') {
      this.router.navigate(['/auth']);
      return;
    }

    this.loadDebts();
    this.loadBlocks();
  }

  loadDebts() {
    this.loading.set(true);
    this.adminDebtService.getAllDebts().subscribe({
      next: (response) => {
        if (response.success) {
          this.debts.set(response.data);
          this.extractFiltersFromDebts();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading debts:', error);
        this.debts.set([]);
        this.loading.set(false);
      }
    });
  }

  filteredDebts = computed(() => {
    // Mostrar deudas vencidas, incluyendo las que tienen pagos en revisión
    let filtered = this.debts().filter(d =>
      (d.isOverdue === true || d.status === 'PaymentSubmitted') &&
      d.status !== 'Paid' &&
      !d.isPaid
    );

    if (this.selectedOwnerName()) {
      filtered = filtered.filter(d => d.ownerName.toLowerCase().includes(this.selectedOwnerName().toLowerCase()));
    }

    if (this.selectedBlock()) {
      filtered = filtered.filter(d => {
        const block = this.getBlock(d);
        return block === this.selectedBlock();
      });
    }

    if (this.selectedApartment()) {
      filtered = filtered.filter(d => {
        const apt = this.getApartmentNumber(d);
        return apt === this.selectedApartment();
      });
    }

    if (this.selectedYear()) {
      filtered = filtered.filter(d => d.year.toString() === this.selectedYear());
    }

    if (this.selectedMonth()) {
      filtered = filtered.filter(d => d.month.toString() === this.selectedMonth());
    }

    const totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    return {
      data: filtered.slice(startIndex, startIndex + this.itemsPerPage),
      totalPages,
      totalCount: filtered.length
    };
  });

  extractFiltersFromDebts() {
    const ownersMap = new Map();
    const yearsSet = new Set<string>();
    const monthsSet = new Set<string>();

    this.debts().filter(d =>
      (d.isOverdue === true || d.status === 'PaymentSubmitted') &&
      d.status !== 'Paid' &&
      !d.isPaid
    ).forEach(debt => {
      // Owners
      if (debt.ownerId && !ownersMap.has(debt.ownerId)) {
        ownersMap.set(debt.ownerId, {
          id: debt.ownerId,
          name: debt.ownerName,
          apartment: debt.apartment
        });
      }



      // Years and months
      if (debt.year) yearsSet.add(debt.year.toString());
      if (debt.month) monthsSet.add(debt.month.toString());
    });

    this.owners.set(Array.from(ownersMap.values()).sort((a, b) => (a.name || '').localeCompare(b.name || '')));

    this.years.set(Array.from(yearsSet).sort().reverse());
    this.months.set(Array.from(monthsSet).sort((a, b) => parseInt(a) - parseInt(b)));
  }

  getBlock(debt: any): string {
    const apartment = debt.apartment || '';
    const apartmentParts = apartment ? apartment.toString().split('-') : ['', ''];
    return apartmentParts.length > 1 ? apartmentParts[0] : '';
  }

  getApartmentNumber(debt: any): string {
    const apartment = debt.apartment || '';
    const apartmentParts = apartment ? apartment.toString().split('-') : ['', ''];
    const result = apartmentParts.length > 1 ? apartmentParts[1] : apartment;
    return result === 'n/a' || result === 'N/A' ? '' : result;
  }

  getMonthName(monthNumber: number): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthNumber - 1] || monthNumber.toString();
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

  generateExcel() {
    this.exportLoading.set(true);
    setTimeout(async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Morosidad');
      const currentDate = new Date().toLocaleDateString('es-ES');

      worksheet.mergeCells('A1:H1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'CONDOFLOW - REPORTE DE MOROSIDAD';
      titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EF4444' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      worksheet.mergeCells('A2:H2');
      const dateCell = worksheet.getCell('A2');
      dateCell.value = `Fecha de generación: ${currentDate}`;
      dateCell.font = { size: 12, italic: true, bold: true };
      dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
      dateCell.alignment = { horizontal: 'center' };

      const headers = ['Propietario', 'Bloque', 'Apartamento', 'Mes', 'Año', 'Monto', 'Días Vencido', 'Estado'];
      worksheet.getRow(4).values = headers;
      worksheet.getRow(4).font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
      worksheet.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DC2626' } };

      let rowIndex = 5;
      this.debts().filter(d =>
        (d.isOverdue === true || d.status === 'PaymentSubmitted') &&
        d.status !== 'Paid' &&
        !d.isPaid
      ).forEach(debt => {
        const row = worksheet.getRow(rowIndex);
        row.values = [
          debt.ownerName,
          this.getBlock(debt),
          this.getApartmentNumber(debt),
          debt.month,
          debt.year,
          debt.amount,
          '',
          'Vencida'
        ];
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF2F2' } };
        rowIndex++;
      });

      worksheet.columns = [
        { width: 30 }, { width: 10 }, { width: 12 }, { width: 12 },
        { width: 8 }, { width: 15 }, { width: 15 }, { width: 12 }
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Morosidad_${new Date().toISOString().split('T')[0]}.xlsx`;
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
      doc.text('CONDOFLOW - REPORTE DE MOROSIDAD', 105, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha de generación: ${currentDate}`, 105, 30, { align: 'center' });

      const data = this.debts().filter(d =>
        (d.isOverdue === true || d.status === 'PaymentSubmitted') &&
        d.status !== 'Paid' &&
        !d.isPaid
      ).map(debt => [
        debt.ownerName,
        this.getBlock(debt),
        this.getApartmentNumber(debt),
        debt.month + '/' + debt.year,
        debt.amount,
        '',
        'Vencida'
      ]);

      autoTable(doc, {
        head: [['Propietario', 'Bloque', 'Apt', 'Período', 'Monto', 'Días Vencido', 'Estado']],
        body: data,
        startY: 40,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [239, 68, 68], textColor: 255 }
      });

      doc.save(`Reporte_Morosidad_${new Date().toISOString().split('T')[0]}.pdf`);
      this.exportLoading.set(false);
    }, 500);
  }

  updateOwnerName(event: any) {
    this.selectedOwnerName.set(event.target.value);
    this.currentPage.set(1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.filteredDebts().totalPages) {
      this.currentPage.set(page);
    }
  }

  goBack() {
    this.router.navigate(['/reports']);
  }
}