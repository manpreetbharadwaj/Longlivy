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

    if (results.length === 0) {
      // No keyword matched anything we know — hand back a single low-confidence
      // guess rather than an empty screen, so there's still something to edit.
      const fallback = FOOD_DATABASE_SEED[0];
      results.push(toRecognizedItem(fallback, fallback.servingSize, 0.2));
    }

    return results;
  }

  /**
   * Photo path: a real implementation would call a vision model. Without
   * one, this returns a small plausible "detected meal" so the review flow
   * can be exercised end-to-end — always at a capped confidence, and always
   * subject to the same mandatory review as the other entry paths.
   */
  recognizeFromPhoto(): AiRecognizedItem[] {
    const sample = ['food_chicken_breast', 'food_rice_cooked', 'food_broccoli']
      .map((id) => FOOD_DATABASE_SEED.find((f) => f.id === id))
      .filter((f): f is Food => !!f);
    return sample.map((food) => toRecognizedItem(food, food.servingSize, 0.4));
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

function extractQuantityNear(text: string, keyword: string): number | null {
  const idx = text.indexOf(keyword);
  if (idx === -1) return null;
  const windowStart = Math.max(0, idx - 15);
  const window = text.slice(windowStart, idx + keyword.length);
  const match = window.match(/(\d+)\s*(g|grams?|ml|kg)?/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export const aiNutritionRecognitionService = new AiNutritionRecognitionService();
