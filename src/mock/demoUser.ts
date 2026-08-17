export const DEMO_USER_ID = 'user_demo_1';

export interface DemoUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gender: 'female' | 'male' | 'diverse';
  heightCm: number;
  weightKg: number;
  address?: string;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'weight_loss' | 'maintenance' | 'general_wellness' | 'muscle_gain';
}

export const DEMO_USER: DemoUserProfile = {
  id: DEMO_USER_ID,
  firstName: 'Alex',
  lastName: 'Rivera',
  email: 'arsh@code4each.com',
  dateOfBirth: '1992-04-18',
  gender: 'diverse',
  heightCm: 176,
  weightKg: 78.4,
  activityLevel: 'moderate',
  goal: 'weight_loss',
};
