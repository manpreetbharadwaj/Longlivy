import { Food } from '@/features/nutrition/models';

const now = new Date().toISOString();

function food(partial: Omit<Food, 'source' | 'verified' | 'createdAt' | 'updatedAt'>): Food {
  return { ...partial, source: 'longlivy_calculated', verified: true, createdAt: now, updatedAt: now };
}

export const FOOD_DATABASE_SEED: Food[] = [
  food({ id: 'food_banana', name: 'Banana', category: 'Fruit', servingSize: 100, unit: 'g', calories: 89, protein: 1.1, carbohydrates: 22.8, fat: 0.3, fiber: 2.6, sugar: 12.2 }),
  food({ id: 'food_chicken_breast', name: 'Chicken Breast, cooked', brand: undefined, category: 'Meat', servingSize: 100, unit: 'g', calories: 165, protein: 31, carbohydrates: 0, fat: 3.6 }),
  food({ id: 'food_rice_cooked', name: 'White Rice, cooked', category: 'Grains', servingSize: 100, unit: 'g', calories: 130, protein: 2.7, carbohydrates: 28, fat: 0.3, fiber: 0.4 }),
  food({ id: 'food_skyr', name: 'Skyr', brand: 'Icelandic Provisions', category: 'Dairy', barcode: '4029764001807', servingSize: 100, unit: 'g', calories: 63, protein: 11, carbohydrates: 4, fat: 0.2 }),
  food({ id: 'food_egg', name: 'Egg, whole', category: 'Dairy & Eggs', servingSize: 50, unit: 'piece', calories: 78, protein: 6.3, carbohydrates: 0.6, fat: 5.3 }),
  food({ id: 'food_wholemeal_bread', name: 'Wholemeal Bread', category: 'Grains', servingSize: 30, unit: 'piece', calories: 69, protein: 3.6, carbohydrates: 11, fat: 1, fiber: 2 }),
  food({ id: 'food_rolled_oats', name: 'Rolled Oats', category: 'Grains', servingSize: 50, unit: 'g', calories: 190, protein: 6.5, carbohydrates: 33, fat: 3.5, fiber: 5 }),
  food({ id: 'food_berries', name: 'Mixed Berries', category: 'Fruit', servingSize: 100, unit: 'g', calories: 43, protein: 0.7, carbohydrates: 9.6, fat: 0.4, fiber: 2.4 }),
  food({ id: 'food_almonds', name: 'Almonds', category: 'Nuts & Seeds', servingSize: 30, unit: 'g', calories: 174, protein: 6.3, carbohydrates: 6, fat: 15 }),
  food({ id: 'food_salmon', name: 'Salmon, grilled', category: 'Fish', servingSize: 100, unit: 'g', calories: 208, protein: 20, carbohydrates: 0, fat: 13 }),
  food({ id: 'food_avocado', name: 'Avocado', category: 'Fruit', servingSize: 100, unit: 'g', calories: 160, protein: 2, carbohydrates: 8.5, fat: 14.7, fiber: 6.7 }),
  food({ id: 'food_greek_yogurt', name: 'Greek Yogurt', category: 'Dairy', servingSize: 100, unit: 'g', calories: 59, protein: 10, carbohydrates: 3.6, fat: 0.4 }),
  food({ id: 'food_broccoli', name: 'Broccoli, steamed', category: 'Vegetables', servingSize: 100, unit: 'g', calories: 35, protein: 2.4, carbohydrates: 7, fat: 0.4, fiber: 3.3 }),
  food({ id: 'food_olive_oil', name: 'Olive Oil', category: 'Oils & Fats', servingSize: 15, unit: 'ml', calories: 119, protein: 0, carbohydrates: 0, fat: 13.5 }),
  food({ id: 'food_protein_shake', name: 'Whey Protein Shake', brand: 'Solace Nutrition', category: 'Supplements', barcode: '4006381333931', servingSize: 30, unit: 'g', calories: 120, protein: 24, carbohydrates: 3, fat: 1.5 }),
  food({ id: 'food_oat_milk', name: 'Oat Milk', brand: 'Solace Nutrition', category: 'Dairy Alternatives', barcode: '7350031320013', servingSize: 100, unit: 'ml', calories: 47, protein: 1, carbohydrates: 6.7, fat: 1.5 }),
];

/** A couple of the barcodes above, surfaced for the manual-lookup fallback when no camera is available. */
export const DEMO_BARCODES = FOOD_DATABASE_SEED.filter((f) => f.barcode).map((f) => ({ barcode: f.barcode as string, name: f.name }));
