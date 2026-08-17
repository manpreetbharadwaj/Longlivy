import { AuthRepository } from './AuthRepository';
import { authRepository as mockAuthRepository } from './MockAuthRepository';
import { apiAuthRepository } from './ApiAuthRepository';
import { env } from '@/config/env';

/**
 * The single switch between the local mock auth (used throughout this
 * prototype today) and the real Axios-backed implementation. Every
 * consumer — `authSlice`, screens — imports `authRepository` from this
 * file, never from `MockAuthRepository`/`ApiAuthRepository` directly, so
 * this is the only line that needs to change when a real backend goes live
 * (or just set EXPO_PUBLIC_API_BASE_URL — see src/config/env.ts).
 */
export const authRepository: AuthRepository = env.useMockApi ? mockAuthRepository : apiAuthRepository;
