/**
 * Platform check helpers
 */

declare var NSObject: any, NSString: any, android: any, java: any, window: any;

/**
 * Electron helpers
 */
export function isElectron() {
  return typeof window !== 'undefined' && window.process && window.process.type;
}

/**
 * Determine if running on NativeScript iOS mobile app
 */
export function isIOS() {
  return typeof NSObject !== 'undefined' && typeof NSString !== 'undefined';
}

/**
 * Determine if running on NativeScript Android mobile app
 */
export function isAndroid() {
  return typeof android !== 'undefined' && typeof java !== 'undefined';
}

/**
 * Determine if running on NativeScript iOS or Android mobile app
 */
export function isNativeScript() {
  return isIOS() || isAndroid();
}
