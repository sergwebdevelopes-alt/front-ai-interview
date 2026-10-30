import { vi } from 'vitest'
import { ProductNotFoundError } from '@/features/products/domain/errors.ts'
import type { ProductListItem, ProductListPage } from '@/features/products/domain/product.ts'
import type { CatalogPageQuery, ProductsRepository } from '@/features/products/domain/productsRepository.ts'
import { makeListItem, makeProduct } from './productFixtures.ts'

export function makeCatalog(count: number): ProductListItem[] {
  return Array.from({ length: count }, (_, index) => {
    const id = index + 1
    return makeListItem({
      id,
      title: `Product ${String(id).padStart(2, '0')}`,
      brand: id % 5 === 0 ? undefined : `Brand ${id % 3}`,
      description: id % 4 === 0 ? `A smart watch number ${id}` : `A plain item number ${id}`,
      category: id % 2 === 0 ? 'watches' : 'phones',
      price: ((id * 37) % 100) + 1,
    })
  })
}

function compare(a: ProductListItem, b: ProductListItem, field: keyof ProductListItem): number {
  const left = a[field] ?? ''
  const right = b[field] ?? ''
  if (typeof left === 'number' && typeof right === 'number') return left - right
  return String(left).localeCompare(String(right))
}

function toPage(items: ProductListItem[], { skip, limit, sort }: CatalogPageQuery): ProductListPage {
  const sorted = sort
    ? [...items].sort((a, b) => compare(a, b, sort.sortBy) * (sort.order === 'asc' ? 1 : -1))
    : items
  return { items: sorted.slice(skip, skip + limit), total: items.length }
}

export function createInMemoryProductsRepository(catalog: ProductListItem[]) {
  return {
    getCatalog: vi.fn<ProductsRepository['getCatalog']>(async (page) => toPage(catalog, page)),
    search: vi.fn<ProductsRepository['search']>(async ({ q, ...page }) => {
      const needle = q.toLowerCase()
      const matches = catalog.filter(
        (item) => item.title.toLowerCase().includes(needle) || item.description.toLowerCase().includes(needle),
      )
      return toPage(matches, page)
    }),
    getById: vi.fn<ProductsRepository['getById']>(async (id) => {
      const item = catalog.find((candidate) => candidate.id === id)
      if (!item) throw new ProductNotFoundError(id)
      return makeProduct({ ...item, description: `Full details of ${item.title}` })
    }),
  }
}
