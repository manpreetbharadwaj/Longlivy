export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'custom';
export type FoodUnit = 'g' | 'kg' | 'ml' | 'l' | 'piece' | 'serving';
export type FoodSource = 'manual' | 'barcode_database' | 'user_recipe' | 'ai_estimated' | 'longlivy_calculated';

export interface Food {
  id: string;
  name: string;
  brand?: string;
  category: string;
  barcode?: string;
  servingSize: number;
  unit: FoodUnit;
  calories: number; // per servingSize
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  saturatedFat?: number;
  sodium?: number;
  source: FoodSource;
  verified: boolean;
  isOwn?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MealItem {
  id: string;
  mealId: string;
  foodId: string;
  foodName: string;
  quantity: number;
  unit: FoodUnit;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  additionalNutrients?: Record<string, number>;
}

export interface Meal {
  id: string;
  userId: string;
  mealType: MealType;
  timestamp: string;
  name: string;
  totalCalories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sodium: number;
  items: MealItem[];
  createdAt: string;
}

export interface Recipe {
  id: string;
  userId: string;
  name: string;
  ingredients: { foodId: string; foodName: string; quantity: number; unit: FoodUnit }[];
  totalAmount: number;
  servings: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbohydrates: number;
  totalFat: number;
}

export interface NutritionGoals {
  calories: { target: number; active: boolean; source: 'auto' | 'manual' };
  protein: { target: number; active: boolean; source: 'auto' | 'manual' };
  carbohydrates: { target: number; active: boolean; source: 'auto' | 'manual' };
  fat: { target: number; active: boolean; source: 'auto' | 'manual' };
  fiber: { target: number; active: boolean; source: 'auto' | 'manual' };
}
