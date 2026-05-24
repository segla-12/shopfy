export type ProductCategory = string;

export type Product = {
  id: string;
  title: string;
  price: number;
  category: ProductCategory;
  image: string;
  images?: string[];
  description: string;
  location?: string;
  country?: string;
  city?: string;
  sellerPhone: string;
  sellerName?: string;
  sellerPhoto?: string;
  sellerId?: string;
  isNew?: boolean;
  isCertified?: boolean;
  certificationStartedAt?: string;
  certificationExpiresAt?: string;
  certificationDurationMonths?: number;
  certificationAmount?: number;
  createdAt?: string;
};

export type ProductCreateInput = Omit<Product, "id" | "createdAt" | "isCertified">;

export type ProductUpdateInput = Partial<
  Pick<Product, "title" | "price" | "category" | "image" | "description" | "location" | "country" | "city">
>;

export type ProductOwnershipInput = {
  productId: string;
  sellerPhone: string;
};

export type ProductCertificationInput = {
  productId: string;
  isCertified: boolean;
};

export type SupabaseProductRow = {
  id?: string | number;
  title: string;
  price: number;
  image: string;
  description: string;
  category: string;
  phone: string;
  location?: string | null;
  country?: string | null;
  city?: string | null;
  seller_name?: string | null;
  seller_photo?: string | null;
  is_certified: boolean;
  certification_started_at?: string | null;
  certification_expires_at?: string | null;
  certification_duration_months?: number | null;
  certification_amount?: number | null;
  created_at: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
};

export type Seller = {
  id: string;
  userId: string;
  shopName: string;
  location: string;
  phone: string;
  isVerified: boolean;
  createdAt: string;
};

export type OrderStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type Order = {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  status: OrderStatus;
  totalPrice: number;
  createdAt: string;
};
