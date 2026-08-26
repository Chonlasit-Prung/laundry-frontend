import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Order } from '../../models/order';
import { OrderService } from '../../services/order.service';
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

    // แปลงวันที่ให้อยู่ในรูปแบบ ISO String
    const isoPickupDate = new Date(this.order.pickupDate).toISOString();

    // ดึงค่า String ของรูปภาพส่งไปตรงๆ (ไม่ตัดเป็น String เปล่า)
    const safeClothImageUrl = typeof this.order.clothImageUrl === 'string' ? this.order.clothImageUrl : '';
    const safePaymentSlipUrl = typeof this.order.paymentSlipUrl === 'string' ? this.order.paymentSlipUrl : '';

    const payload: Order = {
      ...this.order,
      shirtQty: this.hasShirt ? this.order.shirtQty : 0,
      pantQty: this.hasPant ? this.order.pantQty : 0,
      pickupDate: isoPickupDate,
      clothImageUrl: safeClothImageUrl,       // ส่ง Base64 ไปบันทึกใน DB
      paymentSlipUrl: safePaymentSlipUrl     // ส่ง Base64 ไปบันทึกใน DB
    };

    this.orderService.createOrder(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false; // ปลดล็อก

        // 🎉 แสดง Success Alert จาก SweetAlert2
        Swal.fire({
          icon: 'success',
          title: 'บันทึกสำเร็จ!',
          text: `บันทึกออเดอร์เรียบร้อยแล้ว (ID: ${res.id})`,
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          this.resetForm();
        });
      },
      error: (err) => {
        this.isSubmitting = false; // ปลดล็อก
        console.error('Error creating order:', err);

        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาตรวจสอบข้อมูลอีกครั้ง',
          timer: 2000,
          showConfirmButton: false
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
    if (!this.inputPassword.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'แจ้งเตือน',
        text: 'กรุณากรอกรหัสผ่าน',
        showConfirmButton: false,
        timer: 2000 // ปิดเองอัตโนมัติภายใน 1.5 วินาที
      });
      return;
    }

    this.orderService.verifyPassword(this.inputPassword).subscribe({
      next: (res) => {
        if (res.success) {
          //  Alert กรณีรหัสผ่านถูกต้อง
          Swal.fire({
            icon: 'success',
            title: 'เข้าสู่ระบบสำเร็จ',
            text: res.message || 'รหัสผ่านถูกต้อง',
            showConfirmButton: false,
            timer: 2000 // ปิดเองอัตโนมัติภายใน 1.5 วินาที
          }).then(() => {
            this.closePasswordModal();
            this.router.navigate(['/order-list']);
          });

        } else {
          //  Alert กรณีรหัสผ่านไม่ถูกต้อง
          Swal.fire({
            icon: 'error',
            title: 'รหัสผ่านไม่ถูกต้อง',
            text: res.message || 'กรุณาลองใหม่อีกครั้ง',
            showConfirmButton: false,
            timer: 1500 // ปิดเองอัตโนมัติภายใน 1.5 วินาที
          });
          this.inputPassword = '';
        }
      },
      error: (err) => {
        console.error('Error verifying password:', err);

        // Alert กรณีเกิด Error จาก Backend / เชื่อมต่อไม่ได้
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: err.error?.message || 'รหัสผ่านไม่ถูกต้อง หรือไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้',
          showConfirmButton: false,
          timer: 1500 // ปิดเองอัตโนมัติภายใน 1.5 วินาที
        });
        this.inputPassword = '';
      }
    });
  }
}
