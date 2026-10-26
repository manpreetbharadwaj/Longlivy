import { AuthSession, RegisterInput } from '../models';

export interface AuthRepository {
  login(email: string, password: string): Promise<AuthSession>;
  register(input: RegisterInput): Promise<AuthSession>;
  logout(): Promise<void>;
  getCurrentSession(): Promise<AuthSession | null>;
  /** Sends a reset code to the email (always succeeds, whether or not the account exists). */
  requestPasswordReset(email: string): Promise<void>;
  confirmPasswordReset(input: { email: string; code: string; password: string }): Promise<void>;
  verifyEmail(code: string): Promise<void>;
  resendVerificationEmail(): Promise<void>;
  /** Device-scoped: once true, a returning user is never sent back through onboarding. */
  getOnboardingComplete(): Promise<boolean>;
  setOnboardingComplete(value: boolean): Promise<void>;
}
