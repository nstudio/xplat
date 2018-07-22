import { AppService } from './app.service';
import { TNSWindowPlatformService } from './tns-window.service';

export const PROVIDERS: any[] = [
  AppService,
  TNSWindowPlatformService
];

export * from './app.service';
