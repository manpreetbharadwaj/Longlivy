import { Food, Meal, MealItem, Recipe, MealType } from '../models';

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
  getRecipes(userId: string): Promise<Recipe[]>;
  saveRecipe(recipe: Recipe): Promise<Recipe>;
}
