import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { AdminDebtService } from '../../../core/services/admin-debt.service';
import { NavbarComponent } from '../../../shared/components/navbar.component';
import { environment } from '../../../../environments/environment';
import * as ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-owners-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './owners-report.component.html',
  styleUrls: ['./owners-report.component.scss']
})
export class OwnersReportComponent implements OnInit {
  currentUser = signal<any>(null);
  loading = signal(false);
  exportLoading = signal(false);
  debts = signal<any[]>([]);
  blocks = signal<any[]>([]);
  apartments = signal<any[]>([]);
  owners = signal<any[]>([]);
  
  selectedOwner = signal('');
  selectedBlock = signal('');
  selectedApartment = signal('');
  selectedYear = signal('');
  
  currentPage = signal(1);
  itemsPerPage = 10;

  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  filteredData = computed(() => {
    let filtered = this.getOwnersData();
    
    if (this.selectedOwner()) {
      filtered = filtered.filter(owner => owner.name.toLowerCase().includes(this.selectedOwner().toLowerCase()));
    }
    
    if (this.selectedBlock()) {
      filtered = filtered.filter(owner => owner.block === this.selectedBlock());
    }
    
    if (this.selectedApartment()) {
      filtered = filtered.filter(owner => owner.apartment === this.selectedApartment());
    }
    
    if (this.selectedYear()) {
      filtered = filtered.filter(owner => {
        return this.debts().some(debt => 
          debt.ownerId === owner.id && 
          debt.year?.toString() === this.selectedYear()
        );
      });
    }
    
    return filtered;
  });

  paginatedData = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredData().slice(start, end);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredData().length / this.itemsPerPage);
  });

  constructor(
    private authService: AuthService,
    private router: Router,
    private adminDebtService: AdminDebtService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const user = this.authService.currentUser();
    this.currentUser.set(user);
    
    if (!user || user.role !== 'Admin') {
      this.router.navigate(['/auth']);
      return;
    }
    
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    
    this.adminDebtService.getAllDebts().subscribe({
      next: (response) => {
        if (response.success) {
          this.debts.set(response.data);
          this.loadOwnersData();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading debts:', error);
        this.loading.set(false);
      }
    });

    this.loadBlocks();
  }

  loadBlocks() {
    this.http.get(`${environment.apiUrl}/blocks`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.blocks.set(response.data);
        }
      },
      error: (error) => console.error('Error loading blocks:', error)
    });
  }

  onBlockChange() {
    this.selectedApartment.set('');
    if (this.selectedBlock()) {
      this.http.get(`${environment.apiUrl}/apartments/by-block/${this.selectedBlock()}`).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.apartments.set(response.data);
          }
        },
        error: (error) => console.error('Error loading apartments:', error)
      });
    } else {
      this.apartments.set([]);
    }
    this.currentPage.set(1);
  }

  updateOwnerName(event: any) {
    this.selectedOwner.set(event.target.value);
    this.currentPage.set(1);
  }

  applyFilters() {
    this.currentPage.set(1);
  }

  loadOwnersData() {
    // Load registered users to get block and apartment info
    this.http.get(`${environment.apiUrl}/auth/users`).subscribe({
      next: (response: any) => {
        if (response.success) {
          const ownersWithApartments = response.data.filter((user: any) => user.role === 'Owner');
          this.owners.set(ownersWithApartments);
        } else {
          this.extractOwners();
        }
      },
      error: (error) => {
        console.log('Loading basic owner data from debts');
        this.extractOwners();
      }
    });
  }

  extractOwners() {
    const ownersMap = new Map();
    this.debts().forEach(debt => {
      if (!ownersMap.has(debt.ownerId)) {
        ownersMap.set(debt.ownerId, debt.ownerName);
      }
    });
    this.owners.set(Array.from(ownersMap.entries()).map(([id, name]) => ({ id, name })));
  }

  getOwnersData() {
    const ownersMap = new Map();
    
    this.debts().forEach(debt => {
      const key = debt.ownerId;
      if (!ownersMap.has(key)) {
        const ownerInfo = this.owners().find(o => o.id === debt.ownerId);
        
        ownersMap.set(key, {
          id: key,
          name: this.getOwnerName(debt),
          block: this.getBlockFromDebt(debt),
          apartment: this.getApartmentFromDebt(debt),
          pendientes: 0,
          vencidas: 0,
          pagadas: 0,
          totalAdeuda: 0,
          hasDebtInYear: this.selectedYear() ? debt.year?.toString() === this.selectedYear() : true
        });
      }
      
      const ownerData = ownersMap.get(key);
      if (debt.isPaid) {
        ownerData.pagadas++;
      } else if (debt.isOverdue) {
        ownerData.vencidas++;
        ownerData.totalAdeuda += debt.amount;
      } else {
        ownerData.pendientes++;
        ownerData.totalAdeuda += debt.amount;
      }
    });
    
    return Array.from(ownersMap.values());
  }

  getOwnerName(debt: any): string {
    let ownerName = debt.ownerName || '';
    if (ownerName.includes(' | ')) {
      ownerName = ownerName.split(' | ')[0];
    }
    return ownerName;
  }

  getBlockFromDebt(debt: any): string {
    const apt = debt.apartment || '';
    let ownerName = debt.ownerName || '';
    let apartmentFromName = '';
    
    if (ownerName.includes(' | ')) {
      const parts = ownerName.split(' | ');
      apartmentFromName = parts[1] || '';
    }
    
    const finalApartment = apt || apartmentFromName;
    const apartmentParts = finalApartment.toString().split('-');
    return apartmentParts.length > 1 ? apartmentParts[0] : '';
  }

  getApartmentFromDebt(debt: any): string {
    const apt = debt.apartment || '';
    let ownerName = debt.ownerName || '';
    let apartmentFromName = '';
    
    if (ownerName.includes(' | ')) {
      const parts = ownerName.split(' | ');
      apartmentFromName = parts[1] || '';
    }
    
    const finalApartment = apt || apartmentFromName;
    const apartmentParts = finalApartment.toString().split('-');
    return apartmentParts.length > 1 ? apartmentParts[1] : finalApartment;
  }



  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  async generateExcel() {
    this.exportLoading.set(true);
    
    setTimeout(async () => {
      const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Propietarios');
    const currentDate = new Date().toLocaleDateString('es-ES');
    
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'CONDOFLOW - REPORTE DE PROPIETARIOS';
    titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    
    worksheet.mergeCells('A2:G2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `Fecha de generación: ${currentDate}`;
    dateCell.font = { size: 12, italic: true, bold: true };
    dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ECFDF5' } };
    dateCell.alignment = { horizontal: 'center' };
    
    const headers = ['Propietario', 'Bloque', 'Apartamento', 'Pendientes', 'Vencidas', 'Total Adeuda', 'Pagadas'];
    worksheet.getRow(4).values = headers;
    worksheet.getRow(4).font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    worksheet.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '059669' } };
    worksheet.getRow(4).alignment = { horizontal: 'center', vertical: 'middle' };
    
    let rowIndex = 5;
    this.filteredData().forEach(owner => {
      const row = worksheet.getRow(rowIndex);
      row.values = [
        owner.name,
        owner.block,
        owner.apartment,
        owner.pendientes,
        owner.vencidas,
        owner.totalAdeuda,
        owner.pagadas
      ];
      
      if (rowIndex % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
      }
      
      row.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FED7AA' } };
      row.getCell(4).font = { color: { argb: 'C2410C' }, bold: true };
      
      row.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
      row.getCell(5).font = { color: { argb: 'DC2626' }, bold: true };
      
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
      row.getCell(7).font = { color: { argb: '166534' }, bold: true };
      
      rowIndex++;
    });
    
    worksheet.columns = [
      { width: 30 }, { width: 10 }, { width: 12 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }
    ];
    
    worksheet.getRow(1).height = 25;
    worksheet.getRow(4).height = 20;
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-propietarios-${new Date().toISOString().split('T')[0]}.xlsx`;
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
    doc.text('CONDOFLOW - REPORTE DE PROPIETARIOS', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de generación: ${currentDate}`, 105, 30, { align: 'center' });
    
    const tableData = this.filteredData().map(owner => [
      owner.name,
      owner.block,
      owner.apartment,
      owner.pendientes.toString(),
      owner.vencidas.toString(),
      owner.totalAdeuda.toString(),
      owner.pagadas.toString()
    ]);
    
    autoTable(doc, {
      head: [['Propietario', 'Bloque', 'Apt', 'Pendientes', 'Vencidas', 'Total Adeuda', 'Pagadas']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255 }
    });
    
      doc.save(`reporte-propietarios-${new Date().toISOString().split('T')[0]}.pdf`);
      this.exportLoading.set(false);
    }, 500);
  }

  goBack() {
    this.router.navigate(['/reports']);
  }
}