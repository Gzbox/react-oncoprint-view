const type_of_undefined = typeof undefined;
export default function ifNotDefined(target, fallback) {
  if (typeof target === type_of_undefined) {
    return fallback;
  } else {
    return target;
  }
}
