import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Only import emulator connection in development
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  import('./firebase-emulator');
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
