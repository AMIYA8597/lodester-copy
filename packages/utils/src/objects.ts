import Case from "case";

/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

export type KeyCase =
  | "snake"
  | "constant"
  | "camel"
  | "param"
  | "header"
  | "pascal" //Same as squish
  | "dot"
  | "notransform";

export function toExpectedCase(
  value: string,
  expectedCase: KeyCase = "camel",
  customCasingMap?: Record<string, string>
): string {
  if (expectedCase === "notransform") return value;
  if (customCasingMap && customCasingMap[value]) return customCasingMap[value];
  switch (expectedCase) {
    case "param":
      return Case.kebab(value);
    case "dot":
      return Case.lower(value, ".", true);
    default:
      return Case[expectedCase](value);
  }
}

function isObjectObject(val: unknown): boolean {
  return val != null && typeof val === "object" && Array.isArray(val) === false;
}

export function isPlainObject(o: unknown): boolean {
  if (isObjectObject(o) === false) return false;

  // If has modified constructor
  const ctor = (o as Record<string, unknown>).constructor;
  if (typeof ctor !== "function") return false;

  // If has modified prototype
  const prot = ctor.prototype;
  if (isObjectObject(prot) === false) return false;

  // If constructor does not have an Object-specific method
  if (prot.hasOwnProperty("isPrototypeOf") === false) {
    return false;
  }

  // Most likely a plain Object
  return true;
}

/**
 * Creates an object with the same keys as object and values generated by running each own enumerable
 * string keyed property of object thru iteratee.
 *
 * Inspired on lodash.mapValues, see https://lodash.com/docs/4.17.15#mapValues
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapValues<T extends {[K: string]: any}, R>(
  obj: T,
  iteratee: (value: T[keyof T], key: keyof T) => R
): {[K in keyof T]: R} {
  const output = {} as {[K in keyof T]: R};
  for (const [key, value] of Object.entries(obj)) {
    output[key as keyof T] = iteratee(value, key);
  }
  return output;
}

export function objectToExpectedCase<T extends Record<string, unknown> | Record<string, unknown>[] | unknown[]>(
  obj: T,
  expectedCase: "snake" | "constant" | "camel" | "param" | "header" | "pascal" | "dot" | "notransform" = "camel"
): T {
  if (Array.isArray(obj)) {
    const newArr: unknown[] = [];
    for (let i = 0; i < obj.length; i++) {
      newArr[i] = objectToExpectedCase(obj[i] as T, expectedCase);
    }
    return newArr as unknown as T;
  }

  if (Object(obj) === obj) {
    const newObj: Record<string, unknown> = {};
    for (const name of Object.getOwnPropertyNames(obj)) {
      const newName = toExpectedCase(name, expectedCase);
      if (newName !== name && obj.hasOwnProperty(newName)) {
        throw new Error(`object already has a ${newName} property`);
      }

      newObj[newName] = objectToExpectedCase(
        (obj as Record<string, unknown>)[name] as Record<string, unknown>,
        expectedCase
      );
    }
    return newObj as T;
  }

  return obj;
}
