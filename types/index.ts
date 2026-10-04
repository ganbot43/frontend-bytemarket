export type OrderStatus =
  | 'pending' | 'voucher_sent' | 'payment_validated'
  | 'in_preparation' | 'delivered' | 'cancelled'

export type UserRole = 'superadmin' | 'admin'

export type Plan = 'basic' | 'intermediate' | 'advanced'

export interface Product {
  id:            number
  name:          string
  slug:          string
  price:         number
  description:   string | null
  stock:         number
  trackStock:    boolean
  isFeatured:    boolean
  nuevoLanzamiento: boolean
  isActive:      boolean
  createdAt:     string
  updatedAt:     string
  images:        ProductImage[]
  category?:     Category
  subcategory?:  Subcategory
}

export interface ProductImage {
  id:        number
  url:       string
  isPrimary: boolean
  sortOrder: number
}

export interface Category {
  id:             number
  name:           string
  slug:           string
  sortOrder:      number
  createdAt:      string
  subcategories?: Subcategory[]
}

export interface Subcategory {
  id:         number
  categoryId: number
  name:       string
  slug:       string
  createdAt:  string
}

export interface Order {
  id:                        number
  orderCode:                 string
  customerName:              string
  customerPhone:             string | null
  customerAddress:           string | null
  customerNotes:             string | null
  subtotal:                  number
  total:                     number
  status:                    OrderStatus
  paymentMethod?:            PaymentMethod
  // snapshots del método de pago al momento del pedido
  paymentMethodType?:        string | null
  paymentMethodLabel?:       string | null
  paymentMethodQrUrl?:       string | null
  paymentMethodAccountNumber?: string | null
  paymentMethodAccountName?:  string | null
  items:                     OrderItem[]
  statusLogs?:               OrderStatusLog[]
  createdAt:                 string
}

export interface OrderItem {
  id:          number
  productName: string
  unitPrice:   number
  quantity:    number
  subtotal:    number
}

export interface OrderStatusLog {
  id:        number
  status:    OrderStatus
  note:      string | null
  createdAt: string
}

export interface PaymentMethod {
  id:            number
  type:          string
  label:         string
  qrUrl:         string | null
  accountNumber: string | null
  accountName:   string | null
  isActive:      boolean
  sortOrder:     number
}

export interface BusinessConfig {
  id:                 number
  name:               string
  ruc:                string | null
  email:              string | null
  logoUrl:            string | null
  whatsapp:           string
  address:            string | null
  plan:               Plan
  socialLinks:        Record<string, string>
  stockEnabled:       boolean
  autoPaymentEnabled: boolean
  couponsEnabled:     boolean
  multiuserEnabled:   boolean
}

export interface Banner {
  id:         number
  imageUrl:   string
  linkUrl:    string | null
  sortOrder:  number
  isActive:   boolean
  createdAt:  string
}
