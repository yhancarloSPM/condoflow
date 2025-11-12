import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AdminDebtService } from '../../core/services/admin-debt.service';
import { AdminPaymentService } from '../../core/services/admin-payment.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import * as ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  currentUser = signal<any>(null);
  loading = signal(false);
  debts = signal<any[]>([]);
  payments = signal<any[]>([]);
  owners = signal<any[]>([]);


  constructor(
    private authService: AuthService,
    private router: Router,
    private adminDebtService: AdminDebtService,
    private adminPaymentService: AdminPaymentService
  ) {}

  ngOnInit() {
    const user = this.authService.currentUser();
    this.currentUser.set(user);
    
    if (!user) {
      this.router.navigate(['/auth']);
      return;
    }
    
    if (user.role !== 'Admin') {
      console.warn('Access denied: Admin role required for reports');
      return;
    }
    
    this.loadData();
  }

  loadData() {
    this.adminDebtService.getAllDebts().subscribe({
      next: (response) => {
        if (response.success) {
          this.debts.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error loading debts:', error);
        this.debts.set([]);
      }
    });

    this.adminPaymentService.getAllPayments().subscribe({
      next: (response) => {
        if (response.success) {
          this.payments.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error loading payments:', error);
        this.payments.set([]);
      }
    });
  }

  extractOwners() {
    const ownersMap = new Map();
    this.debts().forEach(debt => {
      if (!ownersMap.has(debt.OwnerId)) {
        ownersMap.set(debt.OwnerId, {
          id: debt.OwnerId,
          name: debt.OwnerName,
          apartment: debt.Apartment
        });
      }
    });
    this.owners.set(Array.from(ownersMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
  }



  overdueCount() { 
    return this.debts().filter(d => d.isOverdue === true).length; 
  }
  paymentsCount() { return this.payments().length; }
  ownersCount() { return new Set(this.debts().map(d => d.OwnerId)).size; }

  generateMorosityReport(format: 'excel' | 'pdf' = 'excel') {
    this.loading.set(true);
    setTimeout(() => {
      if (format === 'pdf') {
        this.generatePDFReport('morosity');
      } else {
        this.generateExcelReport('morosity');
      }
      this.loading.set(false);
    }, 1000);
  }



  navigateToPaymentsReport() {
    this.router.navigate(['/reports/payments']);
  }

  navigateToMorosityReport() {
    this.router.navigate(['/reports/morosity']);
  }

  navigateToOwnersReport() {
    this.router.navigate(['/reports/owners']);
  }



  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'A';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  navigateToHome(): void { this.router.navigate(['/welcome']); }
  getPaymentStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Pending': 'Pendiente',
      'pending': 'Pendiente',
      'Approved': 'Aprobado',
      'approved': 'Aprobado', 
      'Rejected': 'Rechazado',
      'rejected': 'Rechazado',
      'Paid': 'Pagada',
      'paid': 'Pagada',
      'Overdue': 'Vencida',
      'overdue': 'Vencida'
    };
    return statusMap[status] || status;
  }

  getDebtStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Pending': 'Pendiente',
      'Paid': 'Pagada',
      'Overdue': 'Vencida'
    };
    return statusMap[status] || status;
  }

  async generateExcelReport(type: 'payments' | 'morosity' | 'financial' | 'owners', ownerId?: string, status?: string, block?: string, apartment?: string, dateFrom?: string, dateTo?: string) {
    const workbook = new ExcelJS.Workbook();
    const currentDate = new Date().toLocaleDateString('es-ES');
    
    let filename = '';
    let sheetName = '';
    
    switch (type) {
      case 'payments':
        filename = `Reporte_Pagos_${new Date().toISOString().split('T')[0]}.xlsx`;
        sheetName = 'Pagos';
        this.createPaymentsSheet(workbook, sheetName, currentDate, ownerId, status, block, apartment, dateFrom, dateTo);
        break;
      case 'morosity':
        filename = `Reporte_Morosidad_${new Date().toISOString().split('T')[0]}.xlsx`;
        sheetName = 'Morosidad';
        this.createMorositySheet(workbook, sheetName, currentDate);
        break;
      case 'financial':
        filename = `Reporte_Financiero_${new Date().toISOString().split('T')[0]}.xlsx`;
        sheetName = 'Financiero';
        this.createFinancialSheet(workbook, sheetName, currentDate);
        break;
      case 'owners':
        filename = `Reporte_Propietarios_${new Date().toISOString().split('T')[0]}.xlsx`;
        sheetName = 'Propietarios';
        this.createOwnersSheet(workbook, sheetName, currentDate);
        break;
    }
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
  
  createPaymentsSheet(workbook: ExcelJS.Workbook, sheetName: string, currentDate: string, ownerId?: string, status?: string, block?: string, apartment?: string, dateFrom?: string, dateTo?: string) {
    const worksheet = workbook.addWorksheet(sheetName);
    
    // Título principal
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'CONDOFLOW - REPORTE DE PAGOS';
    titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.border = { top: {style:'thick'}, left: {style:'thick'}, bottom: {style:'thick'}, right: {style:'thick'} };
    
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
    worksheet.getRow(4).alignment = { horizontal: 'left', vertical: 'middle' };
    
    // Filtrar pagos por propietario, estado, bloque y apartamento
    let filteredPayments = this.payments();
    
    if (ownerId) {
      filteredPayments = filteredPayments.filter(p => p.ownerId === ownerId || p.OwnerId === ownerId);
    }
    
    if (status) {
      filteredPayments = filteredPayments.filter(p => p.status === status);
    }
    
    if (block || apartment) {
      filteredPayments = filteredPayments.filter(p => {
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
        if (block) matches = matches && paymentBlock === block;
        if (apartment) matches = matches && paymentApt === apartment;
        
        return matches;
      });
    }
    
    if (dateFrom || dateTo) {
      filteredPayments = filteredPayments.filter(p => {
        const paymentDate = new Date(p.paymentDate);
        let matches = true;
        
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          matches = matches && paymentDate >= fromDate;
        }
        
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999); // Incluir todo el día
          matches = matches && paymentDate <= toDate;
        }
        
        return matches;
      });
    }
    
    // Datos
    let rowIndex = 5;
    filteredPayments.forEach(payment => {
      console.log('Payment data:', payment);
      const row = worksheet.getRow(rowIndex);
      const apartment = payment.apartment || payment.Apartment || '';
      const apartmentParts = apartment.toString().split('-');
      const block = apartmentParts.length > 1 ? apartmentParts[0] : '';
      const aptNumber = apartmentParts.length > 1 ? apartmentParts[1] : apartment;
      
      // Separar nombre y apartamento si están juntos
      let ownerName = payment.ownerName || '';
      let apartmentFromName = '';
      
      if (ownerName.includes(' | ')) {
        const parts = ownerName.split(' | ');
        ownerName = parts[0];
        apartmentFromName = parts[1] || '';
      }
      
      // Usar apartamento de la separación del nombre si no hay otro
      const finalApartment = apartment || apartmentFromName;
      const finalApartmentParts = finalApartment.toString().split('-');
      const finalBlock = finalApartmentParts.length > 1 ? finalApartmentParts[0] : '';
      const finalAptNumber = finalApartmentParts.length > 1 ? finalApartmentParts[1] : finalApartment;
      
      // Buscar fecha de procesamiento en diferentes propiedades
      const processedDate = payment.processedAt || payment.ProcessedAt || payment.updatedAt || payment.UpdatedAt || payment.modifiedAt || payment.ModifiedAt;
      
      const rowData = [
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
      console.log('Payment all dates:', {
        processedAt: payment.processedAt,
        ProcessedAt: payment.ProcessedAt,
        updatedAt: payment.updatedAt,
        UpdatedAt: payment.UpdatedAt,
        createdAt: payment.createdAt,
        paymentDate: payment.paymentDate
      });
      console.log('Row data for Excel:', rowData);
      row.values = rowData;
      
      // Centrar bloque y apartamento
      row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' }; // Bloque
      row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' }; // Apartamento
      
      // Color de fila alternado
      if (rowIndex % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
      }
      
      // Color del estado
      const statusCell = row.getCell(8);
      const status = this.getPaymentStatusText(payment.status);
      if (status === 'Aprobado') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
        statusCell.font = { color: { argb: '166534' }, bold: true };
      } else if (status === 'Rechazado') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
        statusCell.font = { color: { argb: 'DC2626' }, bold: true };
      } else {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } };
        statusCell.font = { color: { argb: 'D97706' }, bold: true };
      }
      
      rowIndex++;
    });
    
    // Ajustar anchos de columna
    worksheet.columns = [
      { width: 16 },  // Fecha de Pago
      { width: 40 },  // Propietario
      { width: 8, alignment: { horizontal: 'center' } },   // Bloque
      { width: 12, alignment: { horizontal: 'center' } },  // Apartamento
      { width: 12 },  // Monto
      { width: 18 },  // Método de Pago
      { width: 35 },  // Concepto
      { width: 12 },  // Estado
      { width: 16 }   // Fecha Procesamiento
    ];
    
    // Ajustar altura de filas
    worksheet.getRow(1).height = 25;
    worksheet.getRow(4).height = 20;
  }
  
  createMorositySheet(workbook: ExcelJS.Workbook, sheetName: string, currentDate: string) {
    const worksheet = workbook.addWorksheet(sheetName);
    const overdueDebts = this.debts().filter(d => d.isOverdue === true);
    
    // Título
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'CONDOFLOW - REPORTE DE MOROSIDAD';
    titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EF4444' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.border = { top: {style:'thick'}, left: {style:'thick'}, bottom: {style:'thick'}, right: {style:'thick'} };
    
    // Fecha
    worksheet.mergeCells('A2:H2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `Fecha de generación: ${currentDate}`;
    dateCell.font = { size: 12, italic: true, bold: true };
    dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
    dateCell.alignment = { horizontal: 'center' };
    
    // Headers
    const headers = ['Propietario', 'Bloque', 'Apartamento', 'Mes', 'Año', 'Monto', 'Días Vencido', 'Estado'];
    worksheet.getRow(4).values = headers;
    worksheet.getRow(4).font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    worksheet.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DC2626' } };
    worksheet.getRow(4).alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Datos
    let rowIndex = 5;
    overdueDebts.forEach(debt => {
      console.log('Debt data:', debt);
      const row = worksheet.getRow(rowIndex);
      const apartment = debt.apartment || '';
      const apartmentParts = apartment ? apartment.toString().split('-') : ['', ''];
      const block = apartmentParts.length > 1 ? apartmentParts[0] : '';
      const aptNumber = apartmentParts.length > 1 ? apartmentParts[1] : '';
      
      const rowData = [
        debt.ownerName,
        block,
        aptNumber,
        debt.month,
        debt.year,
        debt.amount,
        '',
        'Vencida'
      ];
      console.log('Row data for Excel:', rowData);
      row.values = rowData;
      
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF2F2' } };
      row.getCell(8).font = { bold: true, color: { argb: 'DC2626' } };
      
      rowIndex++;
    });
    
    worksheet.columns = [
      { width: 30 },  // Propietario
      { width: 10 },  // Bloque
      { width: 12 },  // Apartamento
      { width: 12 },  // Mes
      { width: 8 },   // Año
      { width: 15 },  // Monto
      { width: 15 },  // Días Vencido
      { width: 12 }   // Estado
    ];
    
    worksheet.getRow(1).height = 25;
    worksheet.getRow(4).height = 20;
  }
  
  createFinancialSheet(workbook: ExcelJS.Workbook, sheetName: string, currentDate: string) {
    const worksheet = workbook.addWorksheet(sheetName);
    
    // Título
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'CONDOFLOW - REPORTE FINANCIERO';
    titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '8B5CF6' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.border = { top: {style:'thick'}, left: {style:'thick'}, bottom: {style:'thick'}, right: {style:'thick'} };
    
    // Fecha
    worksheet.mergeCells('A2:H2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `Fecha de generación: ${currentDate}`;
    dateCell.font = { size: 12, italic: true, bold: true };
    dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3E8FF' } };
    dateCell.alignment = { horizontal: 'center' };
    
    // Headers
    const headers = ['Mes', 'Año', 'Propietario', 'Bloque', 'Apartamento', 'Monto', 'Estado', 'Tipo'];
    worksheet.getRow(4).values = headers;
    worksheet.getRow(4).font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    worksheet.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '7C3AED' } };
    worksheet.getRow(4).alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Datos
    let rowIndex = 5;
    this.debts().forEach(debt => {
      const row = worksheet.getRow(rowIndex);
      const status = debt.isPaid ? 'Pagada' : debt.isOverdue ? 'Vencida' : 'Pendiente';
      const apartment = debt.apartment || '';
      const apartmentParts = apartment ? apartment.toString().split('-') : ['', ''];
      const block = apartmentParts.length > 1 ? apartmentParts[0] : '';
      const aptNumber = apartmentParts.length > 1 ? apartmentParts[1] : '';
      
      row.values = [
        debt.month,
        debt.year,
        debt.ownerName,
        block,
        aptNumber,
        debt.amount,
        status,
        'Deuda'
      ];
      
      // Color de fila alternado
      if (rowIndex % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
      }
      
      // Color según estado
      const statusCell = row.getCell(7);
      if (status === 'Pagada') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
        statusCell.font = { color: { argb: '166534' }, bold: true };
      } else if (status === 'Vencida') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
        statusCell.font = { color: { argb: 'DC2626' }, bold: true };
      } else {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } };
        statusCell.font = { color: { argb: 'D97706' }, bold: true };
      }
      
      rowIndex++;
    });
    
    worksheet.columns = [
      { width: 12 },  // Mes
      { width: 8 },   // Año
      { width: 30 },  // Propietario
      { width: 10 },  // Bloque
      { width: 12 },  // Apartamento
      { width: 15 },  // Monto
      { width: 12 },  // Estado
      { width: 10 }   // Tipo
    ];
    
    worksheet.getRow(1).height = 25;
    worksheet.getRow(4).height = 20;
  }
  
  createOwnersSheet(workbook: ExcelJS.Workbook, sheetName: string, currentDate: string) {
    const worksheet = workbook.addWorksheet(sheetName);
    const ownersMap = new Map();
    
    this.debts().forEach(debt => {
      const key = debt.ownerId;
      if (!ownersMap.has(key)) {
        ownersMap.set(key, {
          name: debt.ownerName,
          apartment: debt.apartment,
          totalDebt: 0,
          pendingDebt: 0,
          overdueDebt: 0,
          paidDebt: 0
        });
      }
      
      const owner = ownersMap.get(key);
      owner.totalDebt += debt.amount;
      
      if (debt.isPaid) owner.paidDebt += debt.amount;
      else if (debt.isOverdue) owner.overdueDebt += debt.amount;
      else owner.pendingDebt += debt.amount;
    });
    
    // Título
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'CONDOFLOW - REPORTE DE PROPIETARIOS';
    titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.border = { top: {style:'thick'}, left: {style:'thick'}, bottom: {style:'thick'}, right: {style:'thick'} };
    
    // Fecha
    worksheet.mergeCells('A2:H2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `Fecha de generación: ${currentDate}`;
    dateCell.font = { size: 12, italic: true, bold: true };
    dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ECFDF5' } };
    dateCell.alignment = { horizontal: 'center' };
    
    // Headers
    const headers = ['Propietario', 'Bloque', 'Apartamento', 'Deudas Pendientes', 'Deudas Vencidas', 'Total Adeuda', 'Deudas Pagadas'];
    worksheet.getRow(4).values = headers;
    worksheet.getRow(4).font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    worksheet.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '059669' } };
    worksheet.getRow(4).alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Datos
    let rowIndex = 5;
    Array.from(ownersMap.values()).forEach(owner => {
      const status = owner.overdueDebt > 0 ? 'Con Morosidad' : owner.pendingDebt > 0 ? 'Al Día' : 'Sin Deudas';
      const row = worksheet.getRow(rowIndex);
      const apartment = owner.apartment || '';
      const apartmentParts = apartment ? apartment.toString().split('-') : ['', ''];
      const block = apartmentParts.length > 1 ? apartmentParts[0] : '';
      const aptNumber = apartmentParts.length > 1 ? apartmentParts[1] : '';
      
      const totalPendingOverdue = owner.pendingDebt + owner.overdueDebt;
      
      row.values = [
        owner.name,
        block,
        aptNumber,
        owner.pendingDebt,
        owner.overdueDebt,
        totalPendingOverdue,
        owner.paidDebt
      ];
      
      // Color de fila alternado
      if (rowIndex % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
      }
      
      // Colores por tipo de deuda - Columna completa
      // Pendientes - Naranja
      row.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FED7AA' } };
      row.getCell(4).font = { color: { argb: 'C2410C' }, bold: true };
      
      // Vencidas - Rojo
      row.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
      row.getCell(5).font = { color: { argb: 'DC2626' }, bold: true };
      
      // Pagadas - Verde
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
      row.getCell(7).font = { color: { argb: '166534' }, bold: true };
      
      rowIndex++;
    });
    
    worksheet.columns = [
      { width: 30 },  // Propietario
      { width: 10 },  // Bloque
      { width: 12 },  // Apartamento
      { width: 20 },  // Deudas Pendientes
      { width: 15 },  // Deudas Vencidas
      { width: 15 },  // Total Adeuda
      { width: 15 }   // Deudas Pagadas
    ];
    
    worksheet.getRow(1).height = 25;
    worksheet.getRow(4).height = 20;
  }

  generatePDFReport(type: 'payments' | 'morosity' | 'financial' | 'owners', ownerId?: string, status?: string, block?: string, apartment?: string, dateFrom?: string, dateTo?: string) {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString('es-ES');
    
    let title = '';
    let data: any[] = [];
    let headers: string[] = [];
    
    switch (type) {
      case 'payments':
        title = 'REPORTE DE PAGOS';
        data = this.getFilteredPaymentsData(ownerId, status, block, apartment, dateFrom, dateTo);
        headers = ['Fecha', 'Propietario', 'Bloque', 'Apt', 'Monto', 'Método', 'Estado'];
        break;
      case 'morosity':
        title = 'REPORTE DE MOROSIDAD';
        data = this.getMorosityData();
        headers = ['Propietario', 'Bloque', 'Apt', 'Período', 'Monto', 'Días Vencido', 'Estado'];
        break;
      case 'financial':
        title = 'REPORTE FINANCIERO';
        data = this.getFinancialData();
        headers = ['Mes', 'Año', 'Propietario', 'Bloque', 'Apt', 'Monto', 'Estado'];
        break;
      case 'owners':
        title = 'REPORTE DE PROPIETARIOS';
        data = this.getOwnersData(ownerId);
        headers = ['Propietario', 'Bloque', 'Apt', 'Total', 'Pendientes', 'Vencidas', 'Pagadas', 'Estado'];
        break;
    }
    
    // Título
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CONDOFLOW - ' + title, 105, 20, { align: 'center' });
    
    // Fecha
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de generación: ${currentDate}`, 105, 30, { align: 'center' });
    
    // Tabla
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 }
    });
    
    const filename = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  }
  
  getFilteredPaymentsData(ownerId?: string, status?: string, block?: string, apartment?: string, dateFrom?: string, dateTo?: string): any[] {
    let filteredPayments = this.payments();
    
    if (ownerId) {
      filteredPayments = filteredPayments.filter(p => p.ownerId === ownerId || p.OwnerId === ownerId);
    }
    
    if (status) {
      filteredPayments = filteredPayments.filter(p => p.status === status);
    }
    
    if (block || apartment) {
      filteredPayments = filteredPayments.filter(p => {
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
        if (block) matches = matches && paymentBlock === block;
        if (apartment) matches = matches && paymentApt === apartment;
        
        return matches;
      });
    }
    
    if (dateFrom || dateTo) {
      filteredPayments = filteredPayments.filter(p => {
        const paymentDate = new Date(p.paymentDate);
        let matches = true;
        
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          matches = matches && paymentDate >= fromDate;
        }
        
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          matches = matches && paymentDate <= toDate;
        }
        
        return matches;
      });
    }
    
    return filteredPayments.map(payment => {
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
  }
  
  getMorosityData(): any[] {
    console.log('All debts count:', this.debts().length);
    console.log('isOverdue values:', this.debts().map(d => d.isOverdue));
    console.log('Sample debt:', this.debts()[0]);
    const overdueDebts = this.debts().filter(d => d.isOverdue === true);
    console.log('Filtered overdue count:', overdueDebts.length);
    console.log('First overdue debt:', overdueDebts[0]);
    return overdueDebts.map(debt => {
      const apartment = debt.apartment || '';
      const apartmentParts = apartment ? apartment.toString().split('-') : ['', ''];
      const block = apartmentParts.length > 1 ? apartmentParts[0] : '';
      const aptNumber = apartmentParts.length > 1 ? apartmentParts[1] : '';
      
      return [
        debt.ownerName,
        block,
        aptNumber,
        debt.month + '/' + debt.year,
        debt.amount,
        '',
        'Vencida'
      ];
    });
  }
  
  getFinancialData(): any[] {
    console.log('Financial debts:', this.debts());
    return this.debts().map(debt => {
      const apartment = debt.apartment || '';
      const apartmentParts = apartment ? apartment.toString().split('-') : ['', ''];
      const block = apartmentParts.length > 1 ? apartmentParts[0] : '';
      const aptNumber = apartmentParts.length > 1 ? apartmentParts[1] : '';
      
      const status = debt.isPaid ? 'Pagada' : debt.isOverdue ? 'Vencida' : 'Pendiente';
      
      return [
        debt.month,
        debt.year,
        debt.ownerName,
        block,
        aptNumber,
        debt.amount,
        status
      ];
    });
  }
  
  getOwnersData(ownerId?: string): any[] {
    console.log('Owners debts:', this.debts());
    let filteredDebts = this.debts();
    
    // Filtrar por propietario si se especifica
    if (ownerId) {
      filteredDebts = filteredDebts.filter(d => d.ownerId === ownerId);
    }
    
    const ownersMap = new Map();
    
    filteredDebts.forEach(debt => {
      const key = debt.ownerId;
      if (!ownersMap.has(key)) {
        ownersMap.set(key, {
          name: debt.ownerName,
          apartment: debt.apartment,
          totalDebt: 0,
          pendingDebt: 0,
          overdueDebt: 0,
          paidDebt: 0
        });
      }
      
      const owner = ownersMap.get(key);
      owner.totalDebt += debt.amount;
      
      if (debt.isPaid) owner.paidDebt += debt.amount;
      else if (debt.isOverdue) owner.overdueDebt += debt.amount;
      else owner.pendingDebt += debt.amount;
    });
    
    return Array.from(ownersMap.values()).map(owner => {
      const apartment = owner.apartment || '';
      const apartmentParts = apartment ? apartment.toString().split('-') : ['', ''];
      const block = apartmentParts.length > 1 ? apartmentParts[0] : '';
      const aptNumber = apartmentParts.length > 1 ? apartmentParts[1] : '';
      const status = owner.overdueDebt > 0 ? 'Con Morosidad' : owner.pendingDebt > 0 ? 'Al Día' : 'Sin Deudas';
      
      return [
        owner.name,
        block,
        aptNumber,
        owner.totalDebt,
        owner.pendingDebt,
        owner.overdueDebt,
        owner.paidDebt,
        status
      ];
    });
  }

  logout(): void { this.authService.logout(); this.router.navigate(['/auth']); }
}