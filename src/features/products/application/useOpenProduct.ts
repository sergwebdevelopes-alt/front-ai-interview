import { useProductSelectionActions } from '@/features/products/infrastructure/index.ts'

export function useOpenProduct(): (id: number) => void {
  return useProductSelectionActions().open
}
