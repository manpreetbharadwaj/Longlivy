import { NutritionRepository } from './NutritionRepository';
import { Food, Meal, MealType, Recipe } from '../models';
import { LocalStore } from '@/services/storage/LocalStore';
import { generateId } from '@/utils/id';
import { FOOD_DATABASE_SEED } from '@/mock/foodDatabaseSeed';
import { MEALS_SEED } from '@/mock/mealsSeed';
import { scaleNutrition } from '../services/NutritionCalculationService';

interface NutritionDb {
  foods: Food[];
  meals: Meal[];
  recipes: Recipe[];
  favorites: Record<string, string[]>; // userId -> foodIds
}

const store = new LocalStore<NutritionDb>('@longlivy/nutrition_db', {
  foods: FOOD_DATABASE_SEED,
  meals: MEALS_SEED,
  recipes: [],
  favorites: {},
});

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function isSameDay(isoA: string, isoB: string): boolean {
  return new Date(isoA).toDateString() === new Date(isoB).toDateString();
}

export class MockNutritionRepository implements NutritionRepository {
  async searchFoods(query: string): Promise<Food[]> {
    const db = await store.read();
    const q = query.trim().toLowerCase();
    if (!q) return delay(db.foods.slice(0, 20));
    const results = db.foods.filter(
      (f) => f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
    );
    return delay(results);
  }

  async getFoodById(id: string): Promise<Food | null> {
    const db = await store.read();
    return delay(db.foods.find((f) => f.id === id) ?? null);
  }

  async getFoodByBarcode(barcode: string): Promise<Food | null> {
    const db = await store.read();
    return delay(db.foods.find((f) => f.barcode === barcode) ?? null);
  }

  async getFavoriteFoods(userId: string): Promise<Food[]> {
    const db = await store.read();
    const ids = db.favorites[userId] ?? [];
    return delay(db.foods.filter((f) => ids.includes(f.id)));
  }

  async toggleFavorite(userId: string, foodId: string): Promise<void> {
    const db = await store.read();
    const current = db.favorites[userId] ?? [];
    db.favorites[userId] = current.includes(foodId)
      ? current.filter((id) => id !== foodId)
      : [...current, foodId];
    await store.write(db);
  }

  async createOwnFood(input: Omit<Food, 'id' | 'createdAt' | 'updatedAt' | 'source' | 'verified'>): Promise<Food> {
    const db = await store.read();
    const now = new Date().toISOString();
    const food: Food = { ...input, id: generateId('food'), source: 'manual', verified: false, isOwn: true, createdAt: now, updatedAt: now };
    db.foods.push(food);
    await store.write(db);
    return delay(food);
  }

  async getMealsForDate(userId: string, isoDate: string): Promise<Meal[]> {
    const db = await store.read();
    const meals = db.meals.filter((m) => m.userId === userId && isSameDay(m.timestamp, isoDate));
    return delay(meals);
  }

  async addMealItem(input: { userId: string; mealType: MealType; isoDate: string; food: Food; quantity: number }): Promise<Meal> {
    const db = await store.read();
    const scaled = scaleNutrition(input.food, input.quantity);

    let meal = db.meals.find(
      (m) => m.userId === input.userId && m.mealType === input.mealType && isSameDay(m.timestamp, input.isoDate)
    );

    if (!meal) {
      meal = {
        id: generateId('meal'),
        userId: input.userId,
        mealType: input.mealType,
        timestamp: input.isoDate,
        name: input.mealType.charAt(0).toUpperCase() + input.mealType.slice(1),
        totalCalories: 0,
        protein: 0,
        carbohydrates: 0,
        fat: 0,
        fiber: 0,
        sodium: 0,
        items: [],
        createdAt: new Date().toISOString(),
      };
      db.meals.push(meal);
    }

    meal.items.push({
      id: generateId('mealitem'),
      mealId: meal.id,
      foodId: input.food.id,
      foodName: input.food.name,
      quantity: input.quantity,
      unit: input.food.unit,
      calories: scaled.calories,
      protein: scaled.protein,
      carbohydrates: scaled.carbohydrates,
      fat: scaled.fat,
    });

    meal.totalCalories = meal.items.reduce((s, i) => s + i.calories, 0);
    meal.protein = meal.items.reduce((s, i) => s + i.protein, 0);
    meal.carbohydrates = meal.items.reduce((s, i) => s + i.carbohydrates, 0);
    meal.fat = meal.items.reduce((s, i) => s + i.fat, 0);

    await store.write(db);
    return delay(meal);
  }

  async removeMealItem(mealId: string, itemId: string): Promise<Meal | null> {
    const db = await store.read();
    const meal = db.meals.find((m) => m.id === mealId);
    if (!meal) return delay(null);
    meal.items = meal.items.filter((i) => i.id !== itemId);
    meal.totalCalories = meal.items.reduce((s, i) => s + i.calories, 0);
    meal.protein = meal.items.reduce((s, i) => s + i.protein, 0);
    meal.carbohydrates = meal.items.reduce((s, i) => s + i.carbohydrates, 0);
    meal.fat = meal.items.reduce((s, i) => s + i.fat, 0);
    await store.write(db);
    return delay(meal);
  }

  async getRecipes(userId: string): Promise<Recipe[]> {
    const db = await store.read();
    return delay(db.recipes.filter((r) => r.userId === userId));
  }

  async saveRecipe(recipe: Recipe): Promise<Recipe> {
    const db = await store.read();
    const idx = db.recipes.findIndex((r) => r.id === recipe.id);
    if (idx === -1) db.recipes.push(recipe);
    else db.recipes[idx] = recipe;
    await store.write(db);
    return delay(recipe);
  }
}

export const nutritionRepository: NutritionRepository = new MockNutritionRepository();
