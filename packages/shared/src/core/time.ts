export function nowUtc(): Date {
  return new Date();
}

export function cloneDate(value: Date): Date {
  return new Date(value.getTime());
}
