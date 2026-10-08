import { apiRequest, apiRequestParsed } from './apiClient';
import { API_ENDPOINTS } from './apiConfig';
import { dataField, dataList, dataRecord, id, isRecord, num, RecordValue, str } from './laravel';
import { ApiError } from '@/utils/apiError';
import { Food, FoodUnit, Meal, MealItem, MealType, Recipe } from '@/features/nutrition/models';

/**
 * Foods, meals, recipes and favorites — shapes verified against the live API
 * on 2026-10-08. Nutrients are per `base_amount` `base_unit` (e.g. per 100 g)
 * and arrive as decimal strings.
 */

const FOOD_UNITS: FoodUnit[] = ['g', 'kg', 'ml', 'l', 'piece', 'serving'];
/** `custom` is an app-only meal type; the API accepts these four. */
export const API_MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

function unit(value: unknown): FoodUnit {
  const raw = str(value) as FoodUnit | undefined;
  return raw && FOOD_UNITS.includes(raw) ? raw : 'g';
}

function nutrients(raw: RecordValue) {
  const n = isRecord(raw.nutrients) ? raw.nutrients : raw;
  return {
    calories: num(n.calories) ?? 0,
    protein: num(n.protein) ?? 0,
    carbohydrates: num(n.carbohydrates) ?? 0,
    fat: num(n.fat) ?? 0,
    fiber: num(n.fiber),
    sugar: num(n.sugar),
    saturatedFat: num(n.saturated_fat),
    sodium: num(n.sodium),
  };
}

export function mapFood(raw: RecordValue): Food {
  const name = str(raw.name);
  if (!name) throw new ApiError({ kind: 'malformed' });
  const n = nutrients(raw);
  const now = new Date().toISOString();
  return {
    id: id(raw.id),
    name,
    brand: str(raw.brand),
    category: str(raw.category) ?? '',
    barcode: str(raw.barcode),
    servingSize: num(raw.base_amount) ?? 100,
    unit: unit(raw.base_unit),
    ...n,
    source: str(raw.source) === 'barcode' ? 'barcode_database' : 'manual',
    verified: raw.verified === true,
    isOwn: raw.owned === true || raw.is_custom === true,
    createdAt: str(raw.created_at) ?? now,
    updatedAt: str(raw.updated_at) ?? now,
  };
}

function mapMealItem(raw: RecordValue, mealId: string): MealItem {
  const n = nutrients(raw);
  return {
    id: id(raw.id),
    mealId,
    foodId: str(raw.food_id) ?? '',
    foodName: str(raw.name) ?? '',
    quantity: num(raw.quantity) ?? 0,
    unit: unit(raw.unit),
    calories: n.calories,
    protein: n.protein,
    carbohydrates: n.carbohydrates,
    fat: n.fat,
  };
}

export function mapMeal(raw: RecordValue, userId: string): Meal {
  const mealId = id(raw.id);
  const mealType = (str(raw.meal_type) ?? 'snack') as MealType;
  const totals = isRecord(raw.totals) ? raw.totals : {};
  const timestamp = str(raw.logged_at) ?? str(raw.date) ?? new Date().toISOString();
  return {
    id: mealId,
    userId,
    mealType,
    timestamp,
    name: str(raw.name) ?? mealType.charAt(0).toUpperCase() + mealType.slice(1),
    totalCalories: num(totals.calories) ?? 0,
    protein: num(totals.protein) ?? 0,
    carbohydrates: num(totals.carbohydrates) ?? 0,
    fat: num(totals.fat) ?? 0,
    fiber: num(totals.fiber) ?? 0,
    sodium: num(totals.sodium) ?? 0,
    items: Array.isArray(raw.items) ? raw.items.filter(isRecord).map((item) => mapMealItem(item, mealId)) : [],
    createdAt: str(raw.created_at) ?? timestamp,
  };
}

function mapRecipe(raw: RecordValue, userId: string): Recipe {
  const totals = isRecord(raw.totals) ? raw.totals : {};
  const items = Array.isArray(raw.items) ? raw.items.filter(isRecord) : [];
  return {
    id: id(raw.id),
    userId,
    name: str(raw.name) ?? '',
    ingredients: items.map((item) => ({ foodId: str(item.food_id) ?? '', foodName: str(item.name) ?? '', quantity: num(item.quantity) ?? 0, unit: unit(item.unit) })),
    totalAmount: items.reduce((sum, item) => sum + (num(item.quantity) ?? 0), 0),
    servings: num(raw.servings) ?? 1,
    totalCalories: num(totals.calories) ?? 0,
    totalProtein: num(totals.protein) ?? 0,
    totalCarbohydrates: num(totals.carbohydrates) ?? 0,
    totalFat: num(totals.fat) ?? 0,
  };
}

/**
 * A line item for POST /meals, /meals/{id}/items and /recipes. Server foods
 * are referenced by `food_id`; anything else (on-device catalog, AI drafts)
 * is sent free-form with its scaled nutrients — the API requires `name` when
 * `food_id` is absent.
 */
export interface ApiLineItem {
  foodId?: string;
  name: string;
  quantity: number;
  unit: FoodUnit;
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
}

function lineItemWire(item: ApiLineItem): RecordValue {
  if (item.foodId) return { food_id: Number(item.foodId), quantity: item.quantity, unit: item.unit };
  return {
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    calories: item.calories ?? 0,
    protein: item.protein ?? 0,
    carbohydrates: item.carbohydrates ?? 0,
    fat: item.fat ?? 0,
  };
}

/** Server ids are integers; on-device catalog ids ("food_banana") are not. */
export function isServerId(value: string | null | undefined): value is string {
  return !!value && /^\d+$/.test(value);
}

/**
 * The API stores `logged_at` without its UTC offset (19:00+02:00 is saved as
 * 19:00Z) and derives the meal's `date` from it, so local wall-clock time is
 * sent to keep the meal on the user's calendar day.
 */
export function localWallClock(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// --- foods ---------------------------------------------------------------

function searchFoods(query: string): Promise<Food[]> {
  return apiRequestParsed(
    { method: 'GET', url: API_ENDPOINTS.foods.collection, params: query.trim() ? { q: query.trim() } : undefined },
    (body) => dataList(body, 'foods').map(mapFood),
  );
}

function getFood(foodId: string): Promise<Food> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.foods.byId(foodId) }, (body) => mapFood(dataRecord(body, 'food')));
}

/** 404 `{ found: false }` means "unknown barcode", which is a normal result, not an error. */
async function getFoodByBarcode(barcode: string): Promise<Food | null> {
  try {
    return await apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.foods.barcode(barcode) }, (body) => mapFood(dataRecord(body, 'food')));
  } catch (error) {
    if (error instanceof ApiError && error.kind === 'not_found') return null;
    throw error;
  }
}

function createFood(food: Omit<Food, 'id' | 'createdAt' | 'updatedAt' | 'source' | 'verified'>): Promise<Food> {
  const data: RecordValue = {
    name: food.name,
    calories: food.calories,
    protein: food.protein,
    carbohydrates: food.carbohydrates,
    fat: food.fat,
    base_amount: food.servingSize,
    base_unit: food.unit,
  };
  if (food.brand) data.brand = food.brand;
  if (food.category) data.category = food.category;
  if (food.barcode) data.barcode = food.barcode;
  if (food.fiber !== undefined) data.fiber = food.fiber;
  if (food.sugar !== undefined) data.sugar = food.sugar;
  if (food.saturatedFat !== undefined) data.saturated_fat = food.saturatedFat;
  if (food.sodium !== undefined) data.sodium = food.sodium;
  return apiRequestParsed({ method: 'POST', url: API_ENDPOINTS.foods.collection, data }, (body) => mapFood(dataRecord(body, 'food')));
}

// --- meals ---------------------------------------------------------------

function mealsForDate(userId: string, date: string): Promise<Meal[]> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.meals.collection, params: { date } }, (body) =>
    dataList(body, 'meals').map((raw) => mapMeal(raw, userId)),
  );
}

function getMeal(userId: string, mealId: string): Promise<Meal> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.meals.byId(mealId) }, (body) => mapMeal(dataRecord(body, 'meal'), userId));
}

function createMeal(userId: string, input: { mealType: MealType; loggedAt: string; items: ApiLineItem[] }): Promise<Meal> {
  return apiRequestParsed(
    { method: 'POST', url: API_ENDPOINTS.meals.collection, data: { meal_type: input.mealType, logged_at: input.loggedAt, items: input.items.map(lineItemWire) } },
    (body) => mapMeal(dataRecord(body, 'meal'), userId),
  );
}

/** POST /meals/{id}/items returns `{ item, meal }` — the refreshed meal is used directly. */
function addMealItem(userId: string, mealId: string, item: ApiLineItem): Promise<Meal> {
  return apiRequestParsed({ method: 'POST', url: API_ENDPOINTS.meals.items(mealId), data: lineItemWire(item) }, (body) =>
    mapMeal(dataRecord(body, 'meal'), userId),
  );
}

function removeMealItem(userId: string, mealId: string, itemId: string): Promise<Meal> {
  return apiRequestParsed({ method: 'DELETE', url: API_ENDPOINTS.meals.item(mealId, itemId) }, (body) => mapMeal(dataRecord(body, 'meal'), userId));
}

// --- recipes -------------------------------------------------------------

function listRecipes(userId: string): Promise<Recipe[]> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.recipes.collection }, (body) => dataList(body, 'recipes').map((raw) => mapRecipe(raw, userId)));
}

function saveRecipe(userId: string, recipeId: string | null, input: { name: string; servings: number; items: ApiLineItem[] }): Promise<Recipe> {
  const data = { name: input.name, servings: input.servings, items: input.items.map(lineItemWire) };
  return apiRequestParsed(
    recipeId ? { method: 'PUT', url: API_ENDPOINTS.recipes.byId(recipeId), data } : { method: 'POST', url: API_ENDPOINTS.recipes.collection, data },
    (body) => mapRecipe(dataRecord(body, 'recipe'), userId),
  );
}

// --- favorites (shared by foods, meals and meditations) -------------------

export type FavoriteType = 'food' | 'meal' | 'meditation';

export interface ApiFavorite {
  id: string;
  type: FavoriteType;
  targetId: string;
  available: boolean;
  target: RecordValue | null;
}

function listFavorites(): Promise<ApiFavorite[]> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.favorites.collection }, (body) =>
    dataList(body, 'favorites').map((raw) => ({
      id: id(raw.id),
      type: str(raw.type) as FavoriteType,
      targetId: id(raw.favoritable_id),
      available: raw.available !== false,
      target: isRecord(raw.target) ? raw.target : null,
    })),
  );
}

async function addFavorite(type: FavoriteType, targetId: string): Promise<void> {
  await apiRequestParsed({ method: 'POST', url: API_ENDPOINTS.favorites.collection, data: { type, id: Number(targetId) } }, (body) => dataField(body, 'favorite'));
}

async function removeFavorite(favoriteId: string): Promise<void> {
  await apiRequest({ method: 'DELETE', url: API_ENDPOINTS.favorites.byId(favoriteId) });
}

export const nutritionApi = {
  searchFoods,
  getFood,
  getFoodByBarcode,
  createFood,
  mealsForDate,
  getMeal,
  createMeal,
  addMealItem,
  removeMealItem,
  listRecipes,
  saveRecipe,
  listFavorites,
  addFavorite,
  removeFavorite,
};
