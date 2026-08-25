import { Routes } from '@angular/router';
import { OrderFormComponent } from './components/order-form/order-form';
import { OrderListComponent } from './components/order-list/order-list';

export const routes: Routes = [
  { path: '', redirectTo: 'order-form', pathMatch: 'full' },
  { path: 'order-form', component: OrderFormComponent },
  { path: 'order-list', component: OrderListComponent },
];
