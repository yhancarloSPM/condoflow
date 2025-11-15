import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar.component';

@Component({
  selector: 'app-dashboards',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './dashboards.component.html',
  styleUrls: ['./dashboards.component.scss']
})
export class DashboardsComponent {
  constructor(private router: Router) {}

  navigateToMonthlyDashboard(): void {
    this.router.navigate(['/dashboard-monthly']);
  }

  navigateToYearlyDashboard(): void {
    this.router.navigate(['/dashboard-yearly']);
  }
}