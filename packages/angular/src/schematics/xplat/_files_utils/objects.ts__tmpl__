export const isString = function(arg: any) {
  return typeof arg === 'string';
};

export const isObject = function(arg: any) {
  return arg && typeof arg === 'object';
};

export function deepMerge<T1, T2>(target: T1, source: T2): T1 & T2 {
  const result: any = {};
  Object.entries(target).forEach(([key, value]) => {
    if (key in source) {
      // potential overwrite
      if (typeof value !== typeof source[key]) {
        // value type mismatch, always take source values.
        result[key] = source[key];
      } else if (isObject(value)) {
        result[key] = deepMerge(value, source[key]);
      } else {
        result[key] = source[key];
      }
    } else {
      result[key] = value;
    }
  });
  Object.entries(source)
    .filter(([key]) => !(key in target))
    .forEach(([key, value]) => {
      result[key] = value;
    });
  return result;
}
