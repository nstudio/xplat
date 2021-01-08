import { Observable, Observer } from 'rxjs';

// nativescript
import { knownFolders, File, Folder, path } from '@nativescript/core';

export class MobileTranslateLoader {
  constructor(private _path: string) {}

  public getTranslation(lang: string) {
    const filePath = this._getFilePath(lang);
    // console.log('MobileTranslateLoader getTranslation:', filePath);
    return this.requestLocalFile(filePath, lang);
  }

  private requestLocalFile(url: string, lang: string): Observable<any> {
    url = this._getAbsolutePath(url);
    let hasLocaleFile = this._fileExists(url);
    if (!hasLocaleFile) {
      // if not found, try without the region suffix (some may be using json files named with just the lang and no region, ie: en.json vs. en-US.json)
      if (lang && lang.indexOf('-') > -1) {
        const langOnly = lang.split('-')[0];
        if (langOnly) {
          const fallbackPath = this._getFilePath(langOnly);
          url = this._getAbsolutePath(fallbackPath);
          hasLocaleFile = this._fileExists(url);
        }
      }
    }

    // request from local app resources
    return new Observable((observer: Observer<any>) => {
      if (hasLocaleFile) {
        const localFile = this._fileFromPath(url);
        localFile.readText().then(
          (data: string) => {
            try {
              const json = JSON.parse(data);
              observer.next(json);
              observer.complete();
            } catch (error) {
              console.log('parse error:', error);
              // Even though the response status was 2xx, this is still an error.
              // The parse error contains the text of the body that failed to parse.
              const errorResult = {
                error,
                text: data
              };
              observer.error(errorResult);
            }
          },
          (error: Object) => {
            console.log('i18n error:', error);
            const errorResult = { error };
            observer.error(errorResult);
          }
        );
      } else {
        const errorResult = { error: 'not found' };
        observer.error(errorResult);
      }
    });
  }

  private _isLocalRequest(url: string): boolean {
    return url.indexOf('~') === 0 || url.indexOf('/') === 0;
  }

  private _currentApp(): Folder {
    return knownFolders.currentApp();
  }

  private _fileFromPath(filePath: string): File {
    return File.fromPath(filePath);
  }

  private _fileExists(filePath: string): boolean {
    return File.exists(filePath);
  }

  private _getFilePath(lang: string) {
    return `${this._path || '/assets/i18n/'}${lang}.json`;
  }

  private _getAbsolutePath(url: string): string {
    url = url.replace('~', '').replace('/', '');
    url = path.join(this._currentApp().path, url);
    return url;
  }
}
