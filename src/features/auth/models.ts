export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
}

/** Server-side profile fields delivered with auth responses (API mode only). */
export interface AuthServerProfile {
  dateOfBirth: string | null;
  gender: string | null;
  heightCm: number | null;
  weightKg: number | null;
  address: string | null;
  activityLevel: string | null;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  createdAt: string;
  /** Present when the session came from (or was revalidated against) the backend. */
  serverProfile?: AuthServerProfile;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: string;
  gender: 'female' | 'male' | 'diverse';
  heightCm: number;
  weightKg: number;
  /** Collected after registration in the current app flow, so optional here. */
  address?: string;
}
