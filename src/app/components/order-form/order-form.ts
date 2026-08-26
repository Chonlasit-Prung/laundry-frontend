import { Component, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Order } from '../../models/order';
import { OrderService } from '../../services/order.service';
import { timeout } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './order-form.html',
  styleUrls: ['./order-form.css']
})
export class OrderFormComponent {
  private router = inject(Router);
  private orderService = inject(OrderService);
  private cdR = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  hasShirt = false;
  hasPant = false;
  isSubmitting = false;

  order: Order = {
    customerName: '',
    phone: '',
    shirtQty: 1,
    pantQty: 1,
    details: '',
    clothImageUrl: '',
    pickupDate: '',
    paymentSlipUrl: '',
    status: 'pending'
  };

  showPasswordModal = false;
  inputPassword = '';
  isVerifying = false;

  increaseQty(type: 'shirt' | 'pant') {
    if (type === 'shirt') this.order.shirtQty++;
    if (type === 'pant') this.order.pantQty++;
  }

  decreaseQty(type: 'shirt' | 'pant') {
    if (type === 'shirt' && this.order.shirtQty > 1) this.order.shirtQty--;
    if (type === 'pant' && this.order.pantQty > 1) this.order.pantQty--;
  }

  // เพิ่มฟังก์ชันนี้ลงใน order-form.component.ts
  onFileSelect(event: Event, type: 'cloth' | 'slip') {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        // แปลงไฟล์เป็น Base64 String เพื่อเก็บใน clothImageUrl / paymentSlipUrl
        if (type === 'cloth') {
          this.order.clothImageUrl = reader.result as string;
        } else if (type === 'slip') {
          this.order.paymentSlipUrl = reader.result as string;
        }
        this.cdR.detectChanges();
      };

      reader.readAsDataURL(file);
    }
  }

  submitOrder() {
    // 🔹 ถ้ากำลังบันทึกข้อมูลอยู่ ห้ามทำงานซ้ำ
    if (this.isSubmitting) return;

    if (!this.order.customerName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'แจ้งเตือน',
        text: 'กรุณากรอกชื่อผู้รับผ้า',
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }

    if (!this.order.pickupDate) {
      Swal.fire({
        icon: 'warning',
        title: 'แจ้งเตือน',
        text: 'กรุณาเลือกวันนัดรับผ้า',
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }

    //  ล็อกปุ่มทันทีที่เริ่มส่งข้อมูล
    this.isSubmitting = true;

    //  แสดง Loading Popup ป้องกันไม่ให้ผู้ใช้คลิกอะไรเพิ่ม
Swal.fire({
      title: 'กำลังบันทึกข้อมูล...',
      text: 'กรุณารอสักครู่',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const isoPickupDate = new Date(this.order.pickupDate).toISOString();
    const safeClothImageUrl = typeof this.order.clothImageUrl === 'string' ? this.order.clothImageUrl : '';
    const safePaymentSlipUrl = typeof this.order.paymentSlipUrl === 'string' ? this.order.paymentSlipUrl : '';

    const payload: Order = {
      ...this.order,
      shirtQty: this.hasShirt ? this.order.shirtQty : 0,
      pantQty: this.hasPant ? this.order.pantQty : 0,
      pickupDate: isoPickupDate,
      clothImageUrl: safeClothImageUrl,
      paymentSlipUrl: safePaymentSlipUrl
    };

    this.orderService.createOrder(payload).subscribe({
      next: (res) => {
        // 🔹 ใช้ NgZone ครอบเพื่อให้รันปิด Popup ใน Angular Zone ทันที
        this.zone.run(() => {
          this.isSubmitting = false;
          Swal.close(); // ปิด Popup หมุน

          Swal.fire({
            icon: 'success',
            title: 'บันทึกสำเร็จ!',
            text: `บันทึกออเดอร์เรียบร้อยแล้ว`,
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            this.resetForm();
            this.cdR.detectChanges();
          });
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.isSubmitting = false;
          console.error('Error creating order:', err);
          Swal.close();

          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
            timer: 2000,
            showConfirmButton: false
          });
          this.cdR.detectChanges();
      });
    }
  });
}

  resetForm() {
    this.hasShirt = false;
    this.hasPant = false;
    this.order = {
      customerName: '',
      phone: '',
      shirtQty: 1,
      pantQty: 1,
      details: '',
      clothImageUrl: '',
      pickupDate: '',
      paymentSlipUrl: '',
      status: 'pending'
    };

    // ล้างค่าในช่องแนบไฟล์ (ถ้ามี)
    const fileInputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
    fileInputs.forEach(input => input.value = '');
  }

  openPasswordModal() { this.showPasswordModal = true; }
  closePasswordModal() { this.showPasswordModal = false; this.inputPassword = ''; }

verifyPassword() {
  if (this.isVerifying) return;

  if (!this.inputPassword.trim()) {
    Swal.fire({
      icon: 'warning',
      title: 'แจ้งเตือน',
      text: 'กรุณากรอกรหัสผ่าน',
      showConfirmButton: false,
      timer: 1500
    });
    return;
  }

  this.isVerifying = true;

  // 🔹 ตั้ง timeout 15 วินาที กันปุ่มหมุนค้างบนมือถือ
  this.orderService.verifyPassword(this.inputPassword)
    .pipe(timeout(3000))
    .subscribe({
      next: (res) => {
        this.zone.run(() => {
          this.isVerifying = false; // ปลดล็อกปุ่ม

          if (res.success) {
            Swal.fire({
              icon: 'success',
              title: 'เข้าสู่ระบบสำเร็จ',
              text: res.message || 'รหัสผ่านถูกต้อง',
              showConfirmButton: false,
              timer: 1500
            }).then(() => {
              this.closePasswordModal();
              this.router.navigate(['/order-list']);
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'รหัสผ่านไม่ถูกต้อง',
              text: res.message || 'กรุณาลองใหม่อีกครั้ง',
              showConfirmButton: false,
              timer: 1500
            });
            this.inputPassword = '';
          }
          this.cdR.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.isVerifying = false; // 🔹 ต้องปลดล็อกปุ่มทุกครั้งที่เกิด Error
          console.error('Error verifying password:', err);

          let errorMsg = err.error?.message || 'รหัสผ่านไม่ถูกต้อง หรือเชื่อมต่อเซิร์ฟเวอร์ไม่ได้';

          // ดักเคส Timeout ( Render หลับ )
          if (err.name === 'TimeoutError') {
            errorMsg = 'เซิร์ฟเวอร์ตอบสนองช้า (กำลังเริ่มต้นระบบ) กรุณากดตกลงใหม่อีกครั้งครับ';
          }

          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: errorMsg,
            showConfirmButton: true // ปรับให้มีปุ่มกดปิด เพื่อให้ผู้ใช้อ่านข้อความชัดเจน
          });

          this.inputPassword = '';
          this.cdR.detectChanges();
        });
      }
    });
}
}
