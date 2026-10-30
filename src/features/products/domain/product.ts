export type Review = {
  rating: number
  comment: string
  date: string
  reviewerName: string
  reviewerEmail: string
}

export type AvailabilityStatus = 'In Stock' | 'Low Stock' | 'Out of Stock'

export type Product = {
  id: number
  title: string
  description: string
  category: string
  price: number
  discountPercentage: number
  rating: number
  stock: number
  tags: string[]
  brand?: string
  sku: string
  weight: number
  dimensions: { width: number; height: number; depth: number }
  warrantyInformation: string
  shippingInformation: string
  availabilityStatus: AvailabilityStatus
  reviews: Review[]
  returnPolicy: string
  minimumOrderQuantity: number
  meta: {
    createdAt: string
    updatedAt: string
    barcode: string
    qrCode: string
  }
  images: string[]
  thumbnail: string
}

export type ProductListItem = Pick<Product, 'id' | 'brand' | 'title' | 'description' | 'category' | 'price'>

export type ProductListPage = {
  items: ProductListItem[]
  total: number
}
