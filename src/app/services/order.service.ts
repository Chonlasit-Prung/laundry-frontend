import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../models/order';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = 'https://laundry-backend-api-ay00.onrender.com/api/Orders';
  private authUrl = 'https://laundry-backend-api-ay00.onrender.com/api/Auth';
  // 1. ดึงรายการทั้งหมด (GET)
  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }

  // 2. สร้างออเดอร์ใหม่ (POST JSON)
  createOrder(order: Order): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, order);
  }

  // 3. ลบออเดอร์ตาม ID (DELETE)
  deleteOrder(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  // 4. เพิ่มฟังก์ชัน PATCH สำหรับอัปเดตสถานะ
  updateOrderStatus(id: number, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, { status });
  }

  // 3. ยืนยันรหัสผ่าน (POST JSON)
  verifyPassword(password: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.authUrl}/verify-password`, { password });
  }

}
