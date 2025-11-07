import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DebtService {
  private apiUrl = `${environment.apiUrl}/owners`;

  constructor(private http: HttpClient) {}

  getDebts(ownerId: string): Observable<any> {
    console.log('Llamando a:', `${this.apiUrl}/${ownerId}/debts`);
    return this.http.get(`${this.apiUrl}/${ownerId}/debts`);
  }
}