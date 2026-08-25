import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Order } from '../../models/order';
import { DatePipe } from '@angular/common';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './order-list.html',
  styleUrls: ['./order-list.css']
})
export class OrderListComponent implements OnInit {

  constructor(
    private cdr: ChangeDetectorRef
  ) { }

  private orderService = inject(OrderService);
  orders: Order[] = [];

  ngOnInit(): void {
    this.fetchOrders();
  }

  fetchOrders() {
    this.orderService.getOrders().subscribe({
      next: (data) => {
        this.orders = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching orders:', err)
    });
  }

  //  ฟังก์ชันสลับสถานะ
  toggleStatus(order: Order) {
    if (!order.id) return;

    // สลับค่าระหว่าง completed และ pending
    const newStatus = order.status === 'completed' ? 'pending' : 'completed';
    const oldStatus = order.status;

    // Optimistic UI Update (เปลี่ยนสีหน้าจอทันที)
    order.status = newStatus;

    // ยิง PATCH request ไปยัง Backend
    this.orderService.updateOrderStatus(order.id, newStatus).subscribe({
      next: (res) => {
        console.log('อัปเดตสถานะสำเร็จ:', res);
      },
      error: (err) => {
        console.error('Error updating status:', err);
        // ถ้ายิง API ล้มเหลว ให้ย้อนสถานะกลับเป็นค่าเดิม
        order.status = oldStatus;
        alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
      }
    });
  }

  deleteOrder(id?: number) {
    if (!id) return;
    if (confirm(`คุณต้องการลบออเดอร์รหัส ${id} ใช่หรือไม่?`)) {
      this.orderService.deleteOrder(id).subscribe({
        next: (res) => {
          alert(res.message || 'ลบข้อมูลสำเร็จ');
          this.fetchOrders();
        },
        error: (err) => alert('เกิดข้อผิดพลาดในการลบข้อมูล')
      });
    }
  }
}
