import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core'; // 🔹 เพิ่ม NgZone
import { RouterLink } from '@angular/router';
import { Order } from '../../models/order';
import { DatePipe } from '@angular/common';
import { OrderService } from '../../services/order.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './order-list.html',
  styleUrls: ['./order-list.css']
})
export class OrderListComponent implements OnInit {
  private orderService = inject(OrderService);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone); // 🔹 Inject NgZone

  orders: Order[] = [];
  isLoading = true; // 🔹 ตัวแปรเช็กสถานะการโหลดข้อมูล

  ngOnInit(): void {
    this.fetchOrders();
  }

  fetchOrders() {
    this.isLoading = true;

    this.orderService.getOrders().subscribe({
      next: (data) => {
        // 🔹 รันใน Zone เพื่อบังคับอัปเดต UI ทันทีเมื่อ API ตอบกลับ
        this.zone.run(() => {
          this.orders = data;
          this.isLoading = false;
          this.cdr.detectChanges(); // บังคับ Angular Render หน้าใหม่
        });
      },
      error: (err) => {
        this.zone.run(() => {
          console.error('Error fetching orders:', err);
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  toggleStatus(order: Order) {
    if (!order.id) return;

    const newStatus = order.status === 'completed' ? 'pending' : 'completed';
    const oldStatus = order.status;

    order.status = newStatus;

    this.orderService.updateOrderStatus(order.id, newStatus).subscribe({
      next: (res) => {
        this.zone.run(() => {
          console.log('อัปเดตสถานะสำเร็จ:', res);
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          console.error('Error updating status:', err);
          order.status = oldStatus;
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถเปลี่ยนสถานะได้',
            timer: 1500,
            showConfirmButton: false
          });
          this.cdr.detectChanges();
        });
      }
    });
  }

  deleteOrder(id?: number) {
    if (!id) return;

    Swal.fire({
      title: 'ยืนยันการลบ?',
      text: `คุณต้องการลบออเดอร์รหัส ${id} ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ลบข้อมูล',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        this.orderService.deleteOrder(id).subscribe({
          next: (res) => {
            this.zone.run(() => {
              Swal.fire({
                icon: 'success',
                title: 'ลบสำเร็จ!',
                text: res.message || 'ลบข้อมูลสำเร็จ',
                timer: 1500,
                showConfirmButton: false
              });
              this.fetchOrders();
            });
          },
          error: (err) => {
            this.zone.run(() => {
              Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถลบข้อมูลได้',
                timer: 1500,
                showConfirmButton: false
              });
            });
          }
        });
      }
    });
  }
}
