export function updateFilterValue<T>(
  prev: T,
  key: keyof T,
  value: T[keyof T]
): T {
  return {
    ...prev,
    [key]: value,
  }
}