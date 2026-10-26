import { Food, FoodUnit } from '../models';
import { FOOD_DATABASE_SEED } from '@/mock/foodDatabaseSeed';
import { scaleNutrition } from './NutritionCalculationService';

export interface AiRecognizedItem {
  foodId: string;
  foodName: string;
  quantity: number;
  unit: FoodUnit;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  confidence: number; // 0..1 — surfaced in the UI, never hidden
}

/**
 * Stands in for a real vision/speech AI backend. It never writes anything
 * directly — every caller must route its output through a human review step
 * before anything is saved, per the spec's explicit requirement that AI
 * recognition must not become a final entry without being checked.
 */
export class AiNutritionRecognitionService {
  /**
   * Text/voice path: extracts "<quantity> <unit> <food>" style phrases from
   * free text and matches them against the food database by name. This is a
   * simple keyword parser, not a language model — confidence is capped
   * accordingly so the UI never overstates how sure it is.
   */
  recognizeFromText(text: string): AiRecognizedItem[] {
    const normalized = text.toLowerCase();
    const results: AiRecognizedItem[] = [];

    for (const food of FOOD_DATABASE_SEED) {
      const nameLower = food.name.toLowerCase().split(',')[0]; // "Chicken Breast, cooked" -> "chicken breast"
      const keyword = nameLower.split(' ')[0]; // cheap first-word match keeps this readable and fast
      if (!normalized.includes(keyword)) continue;

      const quantity = extractQuantityNear(normalized, keyword) ?? food.servingSize;
      results.push(toRecognizedItem(food, quantity, 0.55));
    }

    // Nothing matched: return nothing. Inventing a "best guess" food would put
    // fabricated nutrition data in front of the user.
    return results;
  }

  /**
   * Photo path: there is no vision model (on device or on the server — POST
   * /nutrition/recognize is a stub), so nothing is recognized. The entry
   * points are hidden behind `features.photoMealRecognition`; this never
   * returns sample foods.
   */
  recognizeFromPhoto(): AiRecognizedItem[] {
    return [];
  }
}

function toRecognizedItem(food: Food, quantity: number, confidence: number): AiRecognizedItem {
  const scaled = scaleNutrition(food, quantity);
  return {
    foodId: food.id,
    foodName: food.name,
    quantity,
    unit: food.unit,
    calories: scaled.calories,
    protein: scaled.protein,
    carbohydrates: scaled.carbohydrates,
    fat: scaled.fat,
    confidence,
  };
}

const WORD_NUMBERS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20,
};
const WORD_NUMBER_PATTERN = Object.keys(WORD_NUMBERS).join('|');

/** Speech dictates "two", "a", "a couple of" more often than digits — spoken-number words are checked first, then a literal digit. */
function extractQuantityNear(text: string, keyword: string): number | null {
  const idx = text.indexOf(keyword);
  if (idx === -1) return null;
  const windowStart = Math.max(0, idx - 20);
  const window = text.slice(windowStart, idx + keyword.length);
  const wordMatch = window.match(new RegExp(`\\b(${WORD_NUMBER_PATTERN})\\b(?:\\s+\\w+){0,2}\\s*$`));
  if (wordMatch) return WORD_NUMBERS[wordMatch[1]];
  const digitMatch = window.match(/(\d+)\s*(g|grams?|ml|kg)?\s*$/);
  if (!digitMatch) return null;
  const value = Number(digitMatch[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export const aiNutritionRecognitionService = new AiNutritionRecognitionService();
