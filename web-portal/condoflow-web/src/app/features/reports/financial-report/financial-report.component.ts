import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { AdminPaymentService } from '../../../core/services/admin-payment.service';
import { NavbarComponent } from '../../../shared/components/navbar.component';
import * as ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-financial-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './financial-report.component.html',
  styleUrls: ['./financial-report.component.scss']
})
export class FinancialReportComponent implements OnInit {
  currentUser = signal<any>(null);
  loading = signal(false);
  exportLoading = signal(false);
  payments = signal<any[]>([]);
  expenses = signal<any[]>([]);
  selectedYear = signal('');
  selectedMonth = signal('');
  years = signal<string[]>([]);
  months = signal<string[]>([]);
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
    
    this.loadFinancialData();
  }

  loadFinancialData() {
    this.loading.set(true);
    
    // Cargar pagos aprobados
    this.adminPaymentService.getAllPayments().subscribe({
      next: (response) => {
        if (response.success) {
          const approvedPayments = response.data.filter((p: any) => p.status === 'approved');
          this.payments.set(approvedPayments);
        }
        this.loadExpenses();
      },
      error: (error) => {
        console.error('Error loading payments:', error);
        this.loadExpenses();
      }
    });
  }

  loadExpenses() {
    this.http.get<any>(`${this.authService.getApiUrl()}/expenses`).subscribe({
      next: (response) => {
        if (response.success) {
          // Incluir gastos confirmados y pagados para el reporte financiero
          const validExpenses = response.data.filter((e: any) => 
            e.statusName === 'Confirmado' || e.statusName === 'Pagado'
          );
          console.log('All expenses:', response.data);
          console.log('Valid expenses for report:', validExpenses);
          this.expenses.set(validExpenses);
        }
        this.extractYearsAndMonths();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading expenses:', error);
        this.expenses.set([]);
        this.extractYearsAndMonths();
        this.loading.set(false);
      }
    });
  }

  extractYearsAndMonths() {
    const yearsSet = new Set<string>();
    
    // Extraer años y meses de pagos
    this.payments().forEach(payment => {
      // Usar el período de la deuda si está disponible, sino usar fecha de pago
      let year;
      if (payment.debtYear && payment.debtMonth) {
        year = payment.debtYear;
      } else {
        const date = new Date(payment.paymentDate);
        year = date.getFullYear();
      }
      
      yearsSet.add(year.toString());
    });
    
    // Extraer años y meses de gastos
    this.expenses().forEach(expense => {
      const date = new Date(expense.date);
      yearsSet.add(date.getFullYear().toString());
    });
    
    this.years.set(Array.from(yearsSet).sort().reverse());
    // Mostrar todos los meses (1-12)
    this.months.set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
  }

  financialData = computed(() => {
    // Obtener todos los años disponibles
    const allYears = new Set<number>();
    
    this.payments().forEach(payment => {
      let year;
      if (payment.debtYear && payment.debtMonth) {
        year = payment.debtYear;
      } else {
        const date = new Date(payment.paymentDate);
        year = date.getFullYear();
      }
      allYears.add(year);
    });
    
    this.expenses().forEach(expense => {
      const date = new Date(expense.date);
      allYears.add(date.getFullYear());
    });
    
    // Crear todos los períodos posibles
    const periodsMap = new Map();
    
    // Generar todos los meses para cada año
    allYears.forEach(year => {
      for (let month = 1; month <= 12; month++) {
        const key = `${year}-${month.toString().padStart(2, '0')}`;
        periodsMap.set(key, {
          year,
          month,
          monthName: this.getMonthName(month),
          income: 0,
          expenses: 0,
          balance: 0
        });
      }
    });
    
    // Procesar pagos (ingresos)
    this.payments().forEach(payment => {
      let year, month;
      if (payment.debtYear && payment.debtMonth) {
        year = payment.debtYear;
        month = payment.debtMonth;
      } else {
        const date = new Date(payment.paymentDate);
        year = date.getFullYear();
        month = date.getMonth() + 1;
      }
      
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      if (periodsMap.has(key)) {
        const period = periodsMap.get(key);
        period.income += payment.amount;
      }
    });
    
    // Procesar gastos
    this.expenses().forEach(expense => {
      const date = new Date(expense.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      
      if (periodsMap.has(key)) {
        const period = periodsMap.get(key);
        period.expenses += expense.amount || 0;
      }
    });
    
    // Calcular balance y filtrar
    let periods = Array.from(periodsMap.values()).map(period => ({
      ...period,
      balance: period.income - period.expenses
    }));
    
    // Aplicar filtros
    if (this.selectedYear()) {
      periods = periods.filter(p => p.year.toString() === this.selectedYear());
    }
    
    if (this.selectedMonth()) {
      periods = periods.filter(p => p.month.toString() === this.selectedMonth());
    }
    
    // Ordenar por año y mes descendente
    periods.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    
    const totalPages = Math.ceil(periods.length / this.itemsPerPage);
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    
    return {
      data: periods.slice(startIndex, startIndex + this.itemsPerPage),
      totalPages,
      totalCount: periods.length,
      allData: periods
    };
  });

  totals = computed(() => {
    const data = this.financialData().allData;
    return {
      totalIncome: data.reduce((sum, p) => sum + p.income, 0),
      totalExpenses: data.reduce((sum, p) => sum + p.expenses, 0),
      totalBalance: data.reduce((sum, p) => sum + p.balance, 0)
    };
  });

  getMonthName(monthNumber: number): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthNumber - 1] || monthNumber.toString();
  }

  generateExcel() {
    this.exportLoading.set(true);
    setTimeout(async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte Financiero');
      const currentDate = new Date().toLocaleDateString('es-ES');
      
      // Título
      worksheet.mergeCells('A1:F1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'CONDOFLOW - REPORTE FINANCIERO';
      titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Fecha
      worksheet.mergeCells('A2:F2');
      const dateCell = worksheet.getCell('A2');
      dateCell.value = `Fecha de generación: ${currentDate}`;
      dateCell.font = { size: 12, italic: true, bold: true };
      dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E5E7EB' } };
      dateCell.alignment = { horizontal: 'center' };
      
      // Headers
      const headers = ['Año', 'Mes', 'Ingresos', 'Gastos', 'Balance', 'Estado'];
      worksheet.getRow(4).values = headers;
      worksheet.getRow(4).font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
      worksheet.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } };
      
      // Datos
      let rowIndex = 5;
      this.financialData().allData.forEach(period => {
        const row = worksheet.getRow(rowIndex);
        row.values = [
          period.year,
          period.monthName,
          period.income,
          period.expenses,
          period.balance,
          period.balance >= 0 ? 'Positivo' : 'Negativo'
        ];
        
        // Color del balance
        if (period.balance >= 0) {
          row.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
          row.getCell(5).font = { color: { argb: '166534' }, bold: true };
        } else {
          row.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
          row.getCell(5).font = { color: { argb: 'DC2626' }, bold: true };
        }
        
        rowIndex++;
      });
      
      // Anchos de columna
      worksheet.columns = [
        { width: 8 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 12 }
      ];
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Financiero_${new Date().toISOString().split('T')[0]}.xlsx`;
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
      doc.text('CONDOFLOW - REPORTE FINANCIERO', 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha de generación: ${currentDate}`, 105, 30, { align: 'center' });
      
      const data = this.financialData().allData.map(period => [
        period.year.toString(),
        period.monthName,
        `$${period.income.toFixed(2)}`,
        `$${period.expenses.toFixed(2)}`,
        `$${period.balance.toFixed(2)}`,
        period.balance >= 0 ? 'Positivo' : 'Negativo'
      ]);
      
      autoTable(doc, {
        head: [['Año', 'Mes', 'Ingresos', 'Gastos', 'Balance', 'Estado']],
        body: data,
        startY: 40,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 }
      });
      
      doc.save(`Reporte_Financiero_${new Date().toISOString().split('T')[0]}.pdf`);
      this.exportLoading.set(false);
    }, 500);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.financialData().totalPages) {
      this.currentPage.set(page);
    }
  }

  goBack() {
    this.router.navigate(['/reports']);
  }
}