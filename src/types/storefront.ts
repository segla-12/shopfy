export type StoreTheme = {
  primary: string;
  accent: string;
};

export type StoreProduct = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  inventoryQuantity: number;
  sourceSupplierName?: string;
  sourceSupplierSlug?: string;
};

export type ShopfyStore = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  ownerName: string;
  city: string;
  country: string;
  currency: string;
  whatsappPhone?: string;
  isCertified?: boolean;
  createdAt?: string;
  trialEndsAt?: string;
  trialDaysRemaining?: number;
  isTrialActive?: boolean;
  requiresCertification?: boolean;
  certificationStartedAt?: string;
  certificationExpiresAt?: string;
  certificationDurationMonths?: number;
  certificationAmount?: number;
  theme: StoreTheme;
  products: StoreProduct[];
  stats: {
    products: number;
    orders: number;
    revenue: number;
    conversionRate: number;
  };
};

export type StoreOrderStatus = "pending" | "confirmed" | "cancelled";
export type StorePaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "cancelled";
export type StoreOrderSource = "platform" | "manual";

export type StoreOrderItem = {
  id: string;
  productId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
};

export type StoreOrder = {
  id: string;
  storeSlug: string;
  status: StoreOrderStatus;
  source: StoreOrderSource;
  paymentStatus: StorePaymentStatus;
  totalAmount: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  sellerComment?: string;
  createdAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  actionUserId?: string;
  items: StoreOrderItem[];
};

export type SupplierSourceProduct = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  image: string;
  wholesalePrice: number;
  recommendedRetailPrice: number;
  currency: string;
  minimumOrderQuantity: number;
  supplierName: string;
  supplierSlug: string;
};
