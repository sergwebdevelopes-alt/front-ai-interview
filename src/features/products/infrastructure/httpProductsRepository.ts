import { HttpError } from '@/shared/http/httpError.ts'
import { httpProvider } from '@/shared/http/httpProvider.ts'
import type { QueryParams } from '@/shared/http/types.ts'
import { ProductNotFoundError } from '@/features/products/domain/errors.ts'
import type { Product, ProductListItem, ProductListPage } from '@/features/products/domain/product.ts'
import type {
  CatalogPageQuery,
  ProductsRepository,
  SearchQuery,
} from '@/features/products/domain/productsRepository.ts'

const LIST_FIELDS = 'brand,title,description,category,price'

type ProductListResponse = {
  products: ProductListItem[]
  total: number
  skip: number
  limit: number
}

function toPageParams({ skip, limit, sort }: CatalogPageQuery): QueryParams {
  return { skip, limit, select: LIST_FIELDS, sortBy: sort?.sortBy, order: sort?.order }
}

async function getPage(path: string, params: QueryParams, signal?: AbortSignal): Promise<ProductListPage> {
  const response = await httpProvider.get<ProductListResponse>(path, { params, signal })
  return { items: response.products, total: response.total }
}

function getCatalog(page: CatalogPageQuery, signal?: AbortSignal): Promise<ProductListPage> {
  return getPage('/products', toPageParams(page), signal)
}

function search({ q, ...page }: SearchQuery, signal?: AbortSignal): Promise<ProductListPage> {
  return getPage('/products/search', { q, ...toPageParams(page) }, signal)
}

async function getById(id: number, signal?: AbortSignal): Promise<Product> {
  try {
    return await httpProvider.get<Product>(`/products/${id}`, { signal })
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) throw new ProductNotFoundError(id)
    throw error
  }
}

export const httpProductsRepository: ProductsRepository = { getCatalog, search, getById }
