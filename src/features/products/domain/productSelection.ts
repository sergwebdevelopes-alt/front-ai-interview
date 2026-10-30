export interface ProductSelectionActions {
  open(id: number): void
  close(): void
}

export interface ProductSelection extends ProductSelectionActions {
  isOpen: boolean
  productId: number | null
}
