import { Food, Meal, Recipe, MealType } from '../models';

export interface NutritionRepository {
  searchFoods(query: string): Promise<Food[]>;
  getFoodById(id: string): Promise<Food | null>;
  getFoodByBarcode(barcode: string): Promise<Food | null>;
  getFavoriteFoods(userId: string): Promise<Food[]>;
  toggleFavorite(userId: string, foodId: string): Promise<void>;
  createOwnFood(food: Omit<Food, 'id' | 'createdAt' | 'updatedAt' | 'source' | 'verified'>): Promise<Food>;
  getMealsForDate(userId: string, isoDate: string): Promise<Meal[]>;
  addMealItem(input: {
    userId: string;
    mealType: MealType;
    isoDate: string;
    food: Food;
    quantity: number;
  }): Promise<Meal>;
  removeMealItem(mealId: string, itemId: string): Promise<Meal | null>;
  /** Changes an item's amount; nutrients scale with it. */
  updateMealItemQuantity(mealId: string, itemId: string, quantity: number): Promise<Meal>;
  deleteMeal(mealId: string): Promise<void>;
  getRecipes(userId: string): Promise<Recipe[]>;
  saveRecipe(recipe: Recipe): Promise<Recipe>;
}
