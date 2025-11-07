import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'https://localhost:7009/api/auth';

  constructor(private http: HttpClient) {}

  getPendingUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/pending-users`);
  }

  approveUser(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/approve-user/${userId}`, {});
  }

  rejectUser(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reject-user/${userId}`, {});
  }

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/all-users`);
  }
}