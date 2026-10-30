type ResultsAnnouncementInput = {
  total: number
  page: number
  pageSize: number
  query: string
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}

export function describeResults({ total, page, pageSize, query }: ResultsAnnouncementInput): string {
  if (total === 0) return query ? `No results for “${query}”` : 'No products'

  const pages = Math.ceil(total / pageSize)
  const position = `page ${page + 1} of ${pages}`
  const count = query
    ? `${plural(total, 'result', 'results')} for “${query}”`
    : plural(total, 'product', 'products')

  return `${count}, ${position}`
}
