import { apiRequestParsed } from './apiClient';
import { API_ENDPOINTS } from './apiConfig';
import { dataRecord, isRecord, num, RecordValue, str } from './laravel';
import { ApiError } from '@/utils/apiError';

/**
 * The server-side profile (`user.profile` on every auth/profile response).
 * Every field except the names is nullable until the user fills it in.
 */
export interface ApiProfile {
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string | null;
  heightCm: number | null;
  weightKg: number | null;
  address: string | null;
  timezone: string | null;
  activityLevel: string | null;
  goal: 'weight_loss' | 'maintenance' | 'general_wellness' | 'muscle_gain' | null;
  weightChangePaceKgPerWeek: number | null;
  trainingFrequency: number | null;
  trainingVolume: 'low' | 'moderate' | 'high' | null;
  fastingMethod: string | null;
  micronutrientFocus: string[] | null;
  avatarId: string | null;
  language: 'en' | 'de' | null;
}

export interface ApiUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  profile: ApiProfile;
}

/**
 * The app's activity levels and the API's names for them (API doc:
 * sedentary|light|moderate|high|very_high; `active`/`very_active` → 422).
 */
const ACTIVITY_TO_SERVER: Record<string, string> = { sedentary: 'sedentary', light: 'light', moderate: 'moderate', active: 'high', very_active: 'very_high' };
const ACTIVITY_FROM_SERVER: Record<string, 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'> = {
  sedentary: 'sedentary',
  light: 'light',
  moderate: 'moderate',
  high: 'active',
  very_high: 'very_active',
};

export function toServerActivityLevel(level: string): string | undefined {
  return ACTIVITY_TO_SERVER[level];
}

export function fromServerActivityLevel(level: string | null): 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | undefined {
  return level ? ACTIVITY_FROM_SERVER[level] : undefined;
}

function mapProfile(raw: RecordValue | undefined, fallbackName: string): ApiProfile {
  const [first = '', ...rest] = fallbackName.split(' ');
  const profile = raw ?? {};
  const dob = str(profile.date_of_birth);
  const height = num(profile.height);
  const weight = num(profile.current_weight);
  const heightCm = height == null ? null : str(profile.height_unit) === 'in' ? height * 2.54 : height;
  const weightKg = weight == null ? null : str(profile.weight_unit) === 'lb' ? weight * 0.45359237 : weight;
  const goal = str(profile.goal);
  const trainingVolume = str(profile.training_volume);
  const language = str(profile.language);
  return {
    firstName: str(profile.first_name) ?? first,
    lastName: str(profile.last_name) ?? rest.join(' '),
    // "1990-05-01T00:00:00.000000Z" after an update, "1990-05-01" elsewhere.
    dateOfBirth: dob ? dob.slice(0, 10) : null,
    gender: str(profile.gender) ?? null,
    heightCm,
    weightKg,
    address: str(profile.address) ?? null,
    timezone: str(profile.timezone) ?? null,
    activityLevel: str(profile.activity_level) ?? null,
    goal: goal === 'weight_loss' || goal === 'maintenance' || goal === 'general_wellness' || goal === 'muscle_gain' ? goal : null,
    weightChangePaceKgPerWeek: num(profile.weight_change_pace_kg_per_week) ?? null,
    trainingFrequency: num(profile.training_frequency) ?? null,
    trainingVolume: trainingVolume === 'low' || trainingVolume === 'moderate' || trainingVolume === 'high' ? trainingVolume : null,
    fastingMethod: str(profile.preferred_fasting_method) ?? null,
    micronutrientFocus: Array.isArray(profile.micronutrient_focus) ? profile.micronutrient_focus.map(str).filter((v): v is string => !!v) : null,
    avatarId: str(profile.avatar_id) ?? null,
    language: language === 'en' || language === 'de' ? language : null,
  };
}

/** Maps `data.user` (with its nested `profile`) — names live on the profile, not the user. */
export function mapApiUser(value: unknown): ApiUser {
  if (!isRecord(value)) throw new ApiError({ kind: 'malformed' });
  const userId = str(value.id);
  const email = str(value.email);
  if (!userId || !email) throw new ApiError({ kind: 'malformed' });
  const profile = mapProfile(isRecord(value.profile) ? value.profile : undefined, str(value.name) ?? '');
  return {
    id: userId,
    email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    emailVerified: Boolean(str(value.email_verified_at)),
    profile,
  };
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  address?: string;
  timezone?: string;
  activityLevel?: string;
  goal?: ApiProfile['goal'];
  weightChangePaceKgPerWeek?: number;
  trainingFrequency?: number;
  trainingVolume?: ApiProfile['trainingVolume'];
  fastingMethod?: string;
  micronutrientFocus?: string[];
  avatarId?: string;
  language?: ApiProfile['language'];
}

function getProfile(): Promise<ApiUser> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.profile }, (body) => mapApiUser(dataRecord(body, 'user')));
}

function updateProfile(input: UpdateProfileInput): Promise<ApiUser> {
  const wire: RecordValue = {};
  if (input.firstName !== undefined) wire.first_name = input.firstName;
  if (input.lastName !== undefined) wire.last_name = input.lastName;
  if (input.dateOfBirth !== undefined) wire.date_of_birth = input.dateOfBirth;
  if (input.gender !== undefined) wire.gender = input.gender;
  if (input.heightCm !== undefined) Object.assign(wire, { height: input.heightCm, height_unit: 'cm' });
  if (input.weightKg !== undefined) Object.assign(wire, { current_weight: input.weightKg, weight_unit: 'kg' });
  if (input.address !== undefined) wire.address = input.address;
  if (input.timezone !== undefined) wire.timezone = input.timezone;
  if (input.activityLevel !== undefined) wire.activity_level = input.activityLevel;
  if (input.goal !== undefined) wire.goal = input.goal;
  if (input.weightChangePaceKgPerWeek !== undefined) wire.weight_change_pace_kg_per_week = input.weightChangePaceKgPerWeek;
  if (input.trainingFrequency !== undefined) wire.training_frequency = input.trainingFrequency;
  if (input.trainingVolume !== undefined) wire.training_volume = input.trainingVolume;
  if (input.fastingMethod !== undefined) wire.preferred_fasting_method = input.fastingMethod;
  if (input.micronutrientFocus !== undefined) wire.micronutrient_focus = input.micronutrientFocus;
  if (input.avatarId !== undefined) wire.avatar_id = input.avatarId;
  if (input.language !== undefined) wire.language = input.language;
  return apiRequestParsed({ method: 'PUT', url: API_ENDPOINTS.profile, data: wire }, (body) => mapApiUser(dataRecord(body, 'user')));
}

export const profileApi = { getProfile, updateProfile };
