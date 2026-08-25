import { OnboardingDraft } from '../OnboardingContext';

export type MicronutrientCategory = 'vitamins' | 'minerals' | 'other';

export interface MicronutrientDef {
  id: string;
  label: string;
  category: MicronutrientCategory;
  /** One line on why it matters — shown on the chip so the choice is legible without leaving the screen for an explainer. */
  blurb: string;
}

export const MICRONUTRIENT_CATEGORIES: { key: MicronutrientCategory; label: string }[] = [
  { key: 'vitamins', label: 'Vitamins' },
  { key: 'minerals', label: 'Minerals' },
  { key: 'other', label: 'Other essentials' },
];

export const MICRONUTRIENTS: MicronutrientDef[] = [
  { id: 'vitamin_d', label: 'Vitamin D', category: 'vitamins', blurb: 'Bone health & immune support' },
  { id: 'vitamin_b12', label: 'Vitamin B12', category: 'vitamins', blurb: 'Energy & nervous system' },
  { id: 'vitamin_c', label: 'Vitamin C', category: 'vitamins', blurb: 'Immunity & tissue repair' },
  { id: 'iron', label: 'Iron', category: 'minerals', blurb: 'Oxygen transport & energy' },
  { id: 'magnesium', label: 'Magnesium', category: 'minerals', blurb: 'Muscle recovery & sleep' },
  { id: 'calcium', label: 'Calcium', category: 'minerals', blurb: 'Bone strength' },
  { id: 'zinc', label: 'Zinc', category: 'minerals', blurb: 'Recovery & immune function' },
  { id: 'potassium', label: 'Potassium', category: 'minerals', blurb: 'Muscle & fluid balance' },
  { id: 'omega_3', label: 'Omega-3', category: 'other', blurb: 'Heart & brain health' },
  { id: 'fiber', label: 'Fiber', category: 'other', blurb: 'Digestion & satiety' },
];

/**
 * Smart defaults for MicronutrientSetupScreen — a small, goal- and
 * gender-aware starting set so the screen opens already personalized
 * ("Long Livy is intelligently setting up your nutrition profile") instead
 * of a blank checklist. Purely a starting point: every chip stays
 * individually toggleable, nothing here is enforced.
 */
export function recommendMicronutrients(goal: OnboardingDraft['goal'], gender: OnboardingDraft['gender']): string[] {
  const picks = new Set<string>(['vitamin_d', 'magnesium', 'omega_3']);
  if (goal === 'weight_loss') ['iron', 'fiber', 'potassium'].forEach((id) => picks.add(id));
  if (goal === 'muscle_gain') ['vitamin_b12', 'zinc', 'potassium'].forEach((id) => picks.add(id));
  if (goal === 'maintenance') ['vitamin_c', 'calcium'].forEach((id) => picks.add(id));
  if (gender === 'female') ['iron', 'calcium'].forEach((id) => picks.add(id));
  if (gender === 'male') ['zinc', 'magnesium'].forEach((id) => picks.add(id));
  return Array.from(picks);
}
