export class ProductNotFoundError extends Error {
  productId: number

  constructor(productId: number) {
    super(`Product ${productId} not found`)
    this.name = 'ProductNotFoundError'
    this.productId = productId
  }
}
