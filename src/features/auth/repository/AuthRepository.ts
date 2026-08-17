import { AuthSession, RegisterInput } from '../models';

export interface AuthRepository {
  login(email: string, password: string): Promise<AuthSession>;
  register(input: RegisterInput): Promise<AuthSession>;
  logout(): Promise<void>;
  getCurrentSession(): Promise<AuthSession | null>;
  resetPassword(email: string): Promise<void>;
  verifyEmail(code: string): Promise<void>;
  /** Device-scoped: once true, a returning user is never sent back through onboarding. */
  getOnboardingComplete(): Promise<boolean>;
  setOnboardingComplete(value: boolean): Promise<void>;
}
