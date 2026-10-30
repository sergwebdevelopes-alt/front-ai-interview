import { httpProductsRepository } from './httpProductsRepository.ts'
import { useUrlCatalogState } from './urlCatalogState.ts'
import { useUrlProductSelection, useUrlProductSelectionActions } from './urlProductSelection.ts'

export const productsRepository = httpProductsRepository

export const useCatalogState = useUrlCatalogState

export const useProductSelection = useUrlProductSelection

export const useProductSelectionActions = useUrlProductSelectionActions
