export function isValidProductId(value: number): boolean {
  return Number.isInteger(value) && value > 0
}
