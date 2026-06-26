export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export function ok<T, E = never>(value: T): Result<T, E> {
  return { ok: true, value };
}

export function fail<T = never, E = unknown>(error: E): Result<T, E> {
  return { ok: false, error };
}

export function isOk<T, E>(
  result: Result<T, E>,
): result is { readonly ok: true; readonly value: T } {
  return result.ok;
}

export function isFail<T, E>(
  result: Result<T, E>,
): result is { readonly ok: false; readonly error: E } {
  return !result.ok;
}
