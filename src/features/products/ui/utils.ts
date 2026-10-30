const priceFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

export function formatPrice(price: number): string {
  return priceFormatter.format(price)
}

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate))
}
