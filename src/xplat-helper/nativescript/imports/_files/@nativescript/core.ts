export * from 'tns-core-modules/application';
import { ios, android, on, off } from 'tns-core-modules/application';
// avoids dupe with utils since they represent different things
export const nsApp = {
  ios,
  android,
  on,
  off
};
import { setString, getString, clear, flush, getAllKeys, getBoolean, getNumber, hasKey, remove, setBoolean, setNumber } from 'tns-core-modules/application-settings';
export const nsSettings = {
  clear,
  flush,
  hasKey,
  remove,
  setString,
  getString,
  getAllKeys,
  getBoolean,
  setBoolean,
  getNumber,
  setNumber
};
export * from 'tns-core-modules/color';
export * from 'tns-core-modules/connectivity';
export * from 'tns-core-modules/data/observable-array';
export * from 'tns-core-modules/data/observable';
export * from 'tns-core-modules/fetch';
export * from 'tns-core-modules/file-system';
import { getFile, getImage, getJSON, getString as httpGetString, request } from 'tns-core-modules/http';
export { HttpRequestOptions, HttpResponse, Headers, HttpResponseEncoding, HttpContent } from 'tns-core-modules/http';
export const nsHttp = {
  getFile,
  getImage,
  getJSON,
  getString: httpGetString,
  request,
};
export * from 'tns-core-modules/image-asset';
export * from 'tns-core-modules/image-source';
export * from 'tns-core-modules/platform';
export { InstrumentationMode, Level, TimerInfo, disable, dumpProfiles, enable, isRunning, level, log, profile, resetProfiles, start, startCPUProfile, stop, stopCPUProfile, time, timer, trace, uptime } from 'tns-core-modules/profiling';
export * from 'tns-core-modules/text';
import { clearInterval, clearTimeout, setInterval, setTimeout } from 'tns-core-modules/timer';
export const nsTimer = {
  clearInterval,
  clearTimeout,
  setInterval,
  setTimeout
};
export * from 'tns-core-modules/trace';
import { GC, isDataURI, ad, convertString, eliminateDuplicates, escapeRegexSymbols, hasDuplicates, ios as tnsIOS, isFileOrResourcePath, mergeSort, openUrl, layout } from 'tns-core-modules/utils/utils';
export const nsUtils = {
  GC,
  isDataURI,
  ad,
  convertString,
  eliminateDuplicates,
  escapeRegexSymbols,
  hasDuplicates,
  ios: tnsIOS,
  isFileOrResourcePath,
  mergeSort,
  openUrl,
  layout
};
