import { updateQueryParams, useQueryParam } from '@/shared/url/useQueryParam.ts'
import { isValidProductId } from '@/features/products/domain/productId.ts'
import type { ProductSelection, ProductSelectionActions } from '@/features/products/domain/productSelection.ts'

const PRODUCT_ID_PARAM = 'productId'

function parseProductId(raw: string | null): number | null {
  if (raw === null) return null
  const value = Number(raw)
  return isValidProductId(value) ? value : null
}

const urlProductSelectionActions: ProductSelectionActions = {
  open: (id) => updateQueryParams({ [PRODUCT_ID_PARAM]: String(id) }),
  close: () => updateQueryParams({ [PRODUCT_ID_PARAM]: null }),
}

export function useUrlProductSelectionActions(): ProductSelectionActions {
  return urlProductSelectionActions
}

export function useUrlProductSelection(): ProductSelection {
  const [rawId] = useQueryParam(PRODUCT_ID_PARAM)
  return {
    isOpen: rawId !== null,
    productId: parseProductId(rawId),
    ...urlProductSelectionActions,
  }
}
