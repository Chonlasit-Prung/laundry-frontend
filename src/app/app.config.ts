
import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

// นำเข้า Locale ภาษาไทย
import registerTh from '@angular/common/locales/th';
import { registerLocaleData } from '@angular/common';

registerLocaleData(registerTh);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    // ตั้งค่า Locale หลักของแอปให้เป็น ภาษาไทย
    { provide: LOCALE_ID, useValue: 'th-TH' }
  ]
};
