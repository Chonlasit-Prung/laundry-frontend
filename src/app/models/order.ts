export interface Order {
  id?: number;
  customerName: string;
  phone: string;
  shirtQty: number;
  pantQty: number;
  details: string;
  clothImageUrl: File | string | null;
  pickupDate: string;
  paymentSlipUrl: File | string | null;
  status: 'pending' | 'completed';
}
