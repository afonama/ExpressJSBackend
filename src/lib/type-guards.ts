/**
 * Exhaustiveness helper for switch statements over enums.
 * Adding a new enum value without handling it in every switch causes a
 * compile error here because `x` is `never`.
 */
export function assertNever(x: never): never {
  throw new Error(`Unhandled enum value: ${JSON.stringify(x)}`);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

export function isJwtPayload(value: unknown): value is { tokenType?: string; sub?: string; role?: string } {
  return isPlainObject(value);
}
