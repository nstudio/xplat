/**
 * @license
 * Copyright (c) 2018 Narwhal Technologies Inc.
 *
 * Use of this source code is governed by an MIT- style license that can be
 * found in the LICENSE file at https://github.com/nrwl/nx/blob/master/LICENSE
 */
import * as path from 'path';

export function names(name: string): any {
  return {
    name,
    className: toClassName(name),
    propertyName: toPropertyName(name),
    fileName: toFileName(name)
  };
}

export function toClassName(str: string): string {
  return toCapitalCase(toPropertyName(str));
}

export function toPropertyName(s: string): string {
  return s
    .replace(
      /(-|_|\.|\s)+(.)?/g,
      (_, __, chr) => (chr ? chr.toUpperCase() : '')
    )
    .replace(/^([A-Z])/, m => m.toLowerCase());
}

export function toFileName(s: string): string {
  return s
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[ _]/g, '-');
}

function toCapitalCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.substr(1);
}

/**
 * Determine the parent directory for the ngModule specified
 * in the full-path option 'module'
 */
export function findModuleParent(modulePath) {
  return path.dirname(modulePath);
}