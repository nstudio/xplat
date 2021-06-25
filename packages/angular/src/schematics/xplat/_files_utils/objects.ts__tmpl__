export const isString = function(arg: any) {
  return typeof arg === 'string';
};

export const isObject = function(arg: any) {
  return arg && typeof arg === 'object';
};

/**
 * @description Produces a deep clone (no references to original object or child objects) of the provided object or array.
 */
 export function deepClone(obj: any): any {
  const ret: any = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (obj[key] === null) {
      ret[key] = null;
    } else if (obj[key] instanceof Date) {
      //typeof date = [object Object], results in empty object.
      const value = obj[key];
      ret[key] = new Date(value.valueOf());
    } else if (typeof obj[key] === 'object') {
      ret[key] = deepClone(obj[key]);
    } else {
      ret[key] = obj[key];
    }
  }
  return ret;
}

/**
 * @description Merge object 2 into object 1 recursively. 
 * This differs from Object.assign() in that child objects are not references to the original.
 * Child objects / arrays that are present in each object are merged.
 * Returns the result, treats object 1 / 2 as immutable since there is no guarantee they are not.
 */
export function deepMerge(obj1: any, obj2: any): any {
  const result: any = {};
  if (obj1 === null) {
    return obj2 === null ? null : deepClone(obj2);
  }
  Object.entries(obj1).forEach(([key, value]) => {
    if (key in obj2) {
      // potential overwrite
      if (typeof value !== typeof obj2[key]) {
        // value type mismatch, always take obj2's values.
        result[key] = obj2[key];
      } else if (typeof value == 'object') {
        result[key] = deepMerge(value, obj2[key]);
      } else {
        result[key] = obj2[key];
      }
    } else {
      result[key] = value;
    }
  });
  Object.entries(obj2)
    .filter(([key]) => !(key in obj1))
    .forEach(([key, value]) => {
      result[key] = value;
    });
  return result;
}
