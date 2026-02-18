const isObject = (val: unknown) =>
    val != null && typeof val === "object" &&
    Array.isArray(val) === false;

const isFunction = (value: unknown): value is Function =>
    typeof value === "function";

export { isFunction, isObject };
