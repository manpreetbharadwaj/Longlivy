import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateAutoCalorieTarget, paceAfterGoalChange } from '../src/features/calories/services/calorieTarget';
import type { BodyProfile } from '../src/features/calories/models';

const body: BodyProfile = { age: 34, gender: 'diverse', heightCm: 176, weightKg: 78.4, activityLevel: 'moderate' };

test('a more active level raises the daily target for the same goal', () => {
  const levels: BodyProfile['activityLevel'][] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
  const targets = levels.map((activityLevel) => calculateAutoCalorieTarget({ ...body, activityLevel }, 'maintenance').calories);
  for (let i = 1; i < targets.length; i++) assert.ok(targets[i] > targets[i - 1], `${levels[i]} should exceed ${levels[i - 1]}`);
});

test('the goal moves the target: loss below maintenance, gain above', () => {
  const loss = calculateAutoCalorieTarget(body, 'weight_loss').calories;
  const keep = calculateAutoCalorieTarget(body, 'maintenance').calories;
  const gain = calculateAutoCalorieTarget(body, 'muscle_gain').calories;
  assert.ok(loss < keep && keep < gain);
  assert.equal(keep - loss, 500);
  assert.equal(gain - keep, 300);
});

test('a chosen pace replaces the default deficit', () => {
  const keep = calculateAutoCalorieTarget(body, 'maintenance').calories;
  const paced = calculateAutoCalorieTarget(body, 'weight_loss', 0.5).calories;
  assert.equal(keep - paced, Math.round((0.5 * 7700) / 7));
});

test('the calculation records which method produced it', () => {
  const result = calculateAutoCalorieTarget(body, 'maintenance');
  assert.equal(result.method, 'Mifflin-St Jeor');
  assert.equal(typeof result.version, 'string');
});

test('a pace only survives an edit that keeps the same goal', () => {
  assert.equal(paceAfterGoalChange('weight_loss', 'weight_loss', 0.5), 0.5);
  assert.equal(paceAfterGoalChange('weight_loss', 'muscle_gain', 0.5), undefined);
  assert.equal(paceAfterGoalChange('weight_loss', 'maintenance', 0.5), undefined);
  assert.equal(paceAfterGoalChange('maintenance', 'weight_loss', undefined), undefined);
});
