import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { WelcomeComponent } from './features/welcome/welcome.component';
import { UserManagementComponent } from './features/user-management/user-management.component';
import { MyPaymentsComponent } from './features/my-payments/my-payments.component';
import { MyDebtsComponent } from './features/my-debts/my-debts.component';
import { DebtManagementComponent } from './features/debt-management/debt-management.component';
import { PaymentManagementComponent } from './features/payment-management/payment-management.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { OwnerDashboardComponent } from './features/owner-dashboard/owner-dashboard.component';
import { ReportsComponent } from './features/reports/reports.component';
import { PaymentsReportComponent } from './features/reports/payments-report.component';
import { MorosityReportComponent } from './features/reports/morosity-report.component';
import { MyProfileComponent } from './features/my-profile/my-profile.component';
import { AnnouncementsComponent } from './features/announcements/announcements.component';
import { AnnouncementManagementComponent } from './features/announcement-management/announcement-management.component';
import { ReservationsComponent } from './features/reservations/reservations.component';
import { ReservationManagementComponent } from './features/reservation-management/reservation-management.component';
import { MyIncidentsComponent } from './features/my-incidents/my-incidents.component';
import { IncidentManagementComponent } from './features/incident-management/incident-management.component';
import { ExpenseManagementComponent } from './features/expense-management/expense-management.component';
import { ProviderManagementComponent } from './features/provider-management/provider-management.component';
import { FinancialReportComponent } from './features/reports/financial-report/financial-report.component';

export const routes: Routes = [
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },
  { path: 'auth', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'welcome', component: WelcomeComponent },
  { path: 'user-management', component: UserManagementComponent },
  { path: 'my-payments', component: MyPaymentsComponent },
  { path: 'my-debts', component: MyDebtsComponent },
  { path: 'debt-management', component: DebtManagementComponent },
  { path: 'payment-management', component: PaymentManagementComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'owner-dashboard', component: OwnerDashboardComponent },
  { path: 'reports', component: ReportsComponent },
  { path: 'reports/payments', component: PaymentsReportComponent },
  { path: 'reports/morosity', component: MorosityReportComponent },
  { path: 'reports/owners', loadComponent: () => import('./features/reports/owners-report/owners-report.component').then(m => m.OwnersReportComponent) },
  { path: 'reports/financial', component: FinancialReportComponent },
  { path: 'my-profile', component: MyProfileComponent },
  { path: 'announcements', component: AnnouncementsComponent },
  { path: 'announcement-management', component: AnnouncementManagementComponent },
  { path: 'reservations', component: ReservationsComponent },
  { path: 'reservation-management', component: ReservationManagementComponent },
  { path: 'my-incidents', component: MyIncidentsComponent },
  { path: 'incident-management', component: IncidentManagementComponent },
  { path: 'expense-management', component: ExpenseManagementComponent },
  { path: 'provider-management', component: ProviderManagementComponent },
  { path: 'contact', redirectTo: '/my-profile', pathMatch: 'full' },
  { path: '**', redirectTo: '/welcome' }
];
