import type { Product, ProductListItem } from '@/features/products/domain/product.ts'

export function makeListItem(overrides: Partial<ProductListItem> = {}): ProductListItem {
  return {
    id: 1,
    brand: 'Apple',
    title: 'iPhone 9',
    description: 'An apple mobile which is nothing like apple',
    category: 'smartphones',
    price: 549,
    ...overrides,
  }
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 12,
    title: 'Rolex Submariner',
    description: 'A classic diving watch',
    category: 'mens-watches',
    price: 9999.99,
    discountPercentage: 7.5,
    rating: 4.2,
    stock: 3,
    tags: ['watches', 'luxury'],
    brand: 'Rolex',
    sku: 'RLX-SUB-001',
    weight: 2,
    dimensions: { width: 4.1, height: 1.3, depth: 4.1 },
    warrantyInformation: '2 year warranty',
    shippingInformation: 'Ships in 1 week',
    availabilityStatus: 'Low Stock',
    reviews: [
      {
        rating: 5,
        comment: 'Perfect!',
        date: '2024-05-23T08:56:21.618Z',
        reviewerName: 'Jane Doe',
        reviewerEmail: 'jane@example.com',
      },
    ],
    returnPolicy: '30 days return policy',
    minimumOrderQuantity: 1,
    meta: {
      createdAt: '2024-05-23T08:56:21.618Z',
      updatedAt: '2024-05-24T08:56:21.618Z',
      barcode: '1234567890123',
      qrCode: 'https://example.com/qr.png',
    },
    images: ['https://example.com/1.png', 'https://example.com/2.png'],
    thumbnail: 'https://example.com/thumb.png',
    ...overrides,
  }
}
