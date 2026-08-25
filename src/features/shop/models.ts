/**
 * Type scaffolding for the future Longlivy Shop — intentionally
 * unreferenced by any slice, screen, or navigation route in this phase.
 * Onboarding's AddressStepScreen already collects `DemoUserProfile.address`
 * "for the future webshop" (see its own comments); these types are the
 * other half of that groundwork, so a later phase can build the real
 * feature against an already-agreed shape instead of guessing one under
 * deadline. Do not delete this file as dead code — it has no call sites by
 * design.
 */

export type ShopCategoryId = 'supplements' | 'nutrition' | 'equipment' | 'apparel' | 'books';

export interface ShopCategory {
  id: ShopCategoryId;
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  categoryId: ShopCategoryId;
  shortDescription: string;
  priceCents: number;
  currency: string;
  imageUrl: string;
  tags: string[];
  inStock: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  label: string;
  priceCents: number;
  sku: string;
  inStock: boolean;
}

export interface ProductDetails extends Product {
  longDescription: string;
  ingredients?: string[];
  /** Matches the macro fields already used by `Food` in `features/nutrition/models.ts`, so a nutrition-adjacent product (e.g. a protein powder) can reuse the same shape as a logged food. */
  nutritionPer100g?: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  };
  usageInstructions?: string;
  variants: ProductVariant[];
  relatedProductIds: string[];
}

/** Why a product was recommended — tied to fields that already exist on `DemoUserProfile` (`features/../mock/demoUser.ts`), not hypothetical ones. */
export type RecommendationReason =
  | 'goal_weight_loss'
  | 'goal_muscle_gain'
  | 'micronutrient_focus'
  | 'fasting_method'
  | 'activity_level'
  | 'low_protein_intake'
  | 'trending';

/** The subset of a user's profile a recommendation engine would read — every field already exists on `DemoUserProfile` today. */
export interface RecommendationContext {
  goal: 'weight_loss' | 'maintenance' | 'general_wellness' | 'muscle_gain';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  micronutrientFocus?: string[];
  fastingMethod?: string;
  currentWeightKg?: number;
}

export interface Recommendation {
  productId: string;
  reason: RecommendationReason;
  /** 0..1 — relative confidence, for ranking multiple recommendations against each other. */
  score: number;
  explanation: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface OrderItem {
  productId: string;
  variantId?: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
}

/** Onboarding today only collects a single free-text `DemoUserProfile.address` string — a real shop needs it split into structured fields. That migration is a future-phase concern, not part of this scaffolding, and does not touch onboarding. */
export interface ShopShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
  status: OrderStatus;
  shippingAddress: ShopShippingAddress;
  placedAt: string;
  updatedAt: string;
}
