import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminDebtService {
  private apiUrl = `${environment.apiUrl}/owners`;

  constructor(private http: HttpClient) {}

  createDebt(ownerId: string, debtData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${ownerId}/debts`, debtData);
  }

  getAllDebts(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/admin/debts`);
  }
}