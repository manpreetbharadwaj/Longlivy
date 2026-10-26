import { NutritionRepository } from './NutritionRepository';
import { Food, Meal, MealType, Recipe } from '../models';
import { scaleNutrition } from '../services/NutritionCalculationService';
import { API_MEAL_TYPES, ApiLineItem, isServerId, localIsoWithOffset, mapFood, nutritionApi } from '@/services/api/nutritionApi';
import { localDateKey } from '@/services/api/laravel';
import { LocalStore } from '@/services/storage/LocalStore';
import { FOOD_DATABASE_SEED } from '@/mock/foodDatabaseSeed';

/**
 * Backed by /foods, /meals, /recipes and /favorites.
 *
 * The backend has no shared food catalog (GET /foods returns only foods the
 * user created; barcode lookup only resolves those). Until one exists, the
 * on-device reference catalog (`FOOD_DATABASE_SEED`, `source:
 * 'longlivy_calculated'`) is searched alongside the server, and its items are
 * logged to the server free-form with their scaled nutrients — the meal, its
 * totals and the energy balance are all server-side either way.
 */
const catalog = FOOD_DATABASE_SEED;

/** Favorites of on-device catalog foods — the server can only favorite its own records. */
const localFavorites = new LocalStore<Record<string, string[]>>('@longlivy/nutrition_catalog_favorites', {});

function catalogMatches(query: string): Food[] {
  const q = query.trim().toLowerCase();
  if (!q) return catalog.slice(0, 20);
  return catalog.filter((f) => f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q) || f.category.toLowerCase().includes(q));
}

function lineItem(food: Food, quantity: number): ApiLineItem {
  if (isServerId(food.id)) return { foodId: food.id, name: food.name, quantity, unit: food.unit };
  const scaled = scaleNutrition(food, quantity);
  return { name: food.name, quantity, unit: food.unit, calories: scaled.calories, protein: scaled.protein, carbohydrates: scaled.carbohydrates, fat: scaled.fat };
}

function apiMealType(mealType: MealType): MealType {
  return API_MEAL_TYPES.includes(mealType) ? mealType : 'snack';
}

export class ApiNutritionRepository implements NutritionRepository {
  /** Set by every user-scoped call; removeMealItem's contract has no userId. */
  private userId = '';

  async searchFoods(query: string): Promise<Food[]> {
    const server = await nutritionApi.searchFoods(query);
    return [...server, ...catalogMatches(query)];
  }

  async getFoodById(foodId: string): Promise<Food | null> {
    if (!isServerId(foodId)) return catalog.find((f) => f.id === foodId) ?? null;
    return nutritionApi.getFood(foodId);
  }

  async getFoodByBarcode(barcode: string): Promise<Food | null> {
    return (await nutritionApi.getFoodByBarcode(barcode)) ?? catalog.find((f) => f.barcode === barcode) ?? null;
  }

  async getFavoriteFoods(userId: string): Promise<Food[]> {
    const [favorites, local] = await Promise.all([nutritionApi.listFavorites(), localFavorites.read()]);
    const server = favorites.filter((f) => f.type === 'food' && f.available && f.target).map((f) => mapFood(f.target!));
    const localIds = local[userId] ?? [];
    return [...server, ...catalog.filter((f) => localIds.includes(f.id))];
  }

  async toggleFavorite(userId: string, foodId: string): Promise<void> {
    if (!isServerId(foodId)) {
      const all = { ...(await localFavorites.read()) };
      const current = all[userId] ?? [];
      all[userId] = current.includes(foodId) ? current.filter((x) => x !== foodId) : [...current, foodId];
      await localFavorites.write(all);
      return;
    }
    const existing = (await nutritionApi.listFavorites()).find((f) => f.type === 'food' && f.targetId === foodId);
    if (existing) await nutritionApi.removeFavorite(existing.id);
    else await nutritionApi.addFavorite('food', foodId);
  }

  createOwnFood(food: Omit<Food, 'id' | 'createdAt' | 'updatedAt' | 'source' | 'verified'>): Promise<Food> {
    return nutritionApi.createFood(food);
  }

  getMealsForDate(userId: string, isoDate: string): Promise<Meal[]> {
    this.userId = userId;
    return nutritionApi.mealsForDate(userId, localDateKey(new Date(isoDate)));
  }

  /** Appends to the day's meal of that type (the mock's contract), creating it on first use. */
  async addMealItem(input: { userId: string; mealType: MealType; isoDate: string; food: Food; quantity: number }): Promise<Meal> {
    const day = new Date(input.isoDate);
    const mealType = apiMealType(input.mealType);
    const meals = await nutritionApi.mealsForDate(input.userId, localDateKey(day));
    const existing = meals.find((m) => m.mealType === mealType);
    const item = lineItem(input.food, input.quantity);
    if (existing) return nutritionApi.addMealItem(input.userId, existing.id, item);
    return nutritionApi.createMeal(input.userId, { mealType, loggedAt: localIsoWithOffset(day), items: [item] });
  }

  async removeMealItem(mealId: string, itemId: string): Promise<Meal | null> {
    // The token scopes the call server-side; the id only labels the returned meal.
    return nutritionApi.removeMealItem(this.userId, mealId, itemId);
  }

  async updateMealItemQuantity(mealId: string, itemId: string, quantity: number): Promise<Meal> {
    const meal = await nutritionApi.getMeal(this.userId, mealId);
    const item = meal.items.find((i) => i.id === itemId);
    if (!item) throw new Error('This item no longer exists.');
    return nutritionApi.updateMealItem(this.userId, mealId, item, quantity);
  }

  deleteMeal(mealId: string): Promise<void> {
    return nutritionApi.deleteMeal(mealId);
  }

  getRecipes(userId: string): Promise<Recipe[]> {
    return nutritionApi.listRecipes(userId);
  }

  async saveRecipe(recipe: Recipe): Promise<Recipe> {
    const items = recipe.ingredients.map((ingredient) => {
      const food = isServerId(ingredient.foodId) ? null : catalog.find((f) => f.id === ingredient.foodId);
      if (food) return lineItem(food, ingredient.quantity);
      return { foodId: isServerId(ingredient.foodId) ? ingredient.foodId : undefined, name: ingredient.foodName, quantity: ingredient.quantity, unit: ingredient.unit };
    });
    return nutritionApi.saveRecipe(recipe.userId, isServerId(recipe.id) ? recipe.id : null, { name: recipe.name, servings: recipe.servings, items });
  }
}
