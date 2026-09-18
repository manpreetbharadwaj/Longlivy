import { AuthRepository } from './AuthRepository';
import { AuthSession, RegisterInput } from '../models';
import { LocalStore } from '@/services/storage/LocalStore';
import { generateId } from '@/utils/id';
import { DEMO_USER, DEMO_LOGIN_EMAIL, DEMO_LOGIN_PASSWORD } from '@/mock/demoUser';

interface AuthDb {
  users: { id: string; email: string; password: string; firstName: string; lastName: string; emailVerified: boolean }[];
  session: AuthSession | null;
  onboardingComplete: boolean;
}

const store = new LocalStore<AuthDb>('@app/auth_db', {
  users: [
    {
      id: DEMO_USER.id,
      // The seeded login credential is the fictitious DEMO_LOGIN_EMAIL, not
      // DEMO_USER.email (the real signed-in developer's actual address) —
      // this account still backs DEMO_USER's profile/display data by
      // sharing its `id`, it just isn't reachable by typing that real
      // email into the login form.
      email: DEMO_LOGIN_EMAIL,
      password: DEMO_LOGIN_PASSWORD,
      firstName: DEMO_USER.firstName,
      lastName: DEMO_USER.lastName,
      emailVerified: true,
    },
  ],
  session: null,
  onboardingComplete: false,
});

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export class MockAuthRepository implements AuthRepository {
  async login(email: string, password: string): Promise<AuthSession> {
    const db = await store.read();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password.');
    }
    const session: AuthSession = {
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, emailVerified: user.emailVerified },
      token: generateId('token'),
      createdAt: new Date().toISOString(),
    };
    db.session = session;
    await store.write(db);
    return delay(session);
  }

  async register(input: RegisterInput): Promise<AuthSession> {
    const db = await store.read();
    if (db.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
      throw new Error('An account with this email already exists.');
    }
    const newUser = {
      id: generateId('user'),
      email: input.email,
      password: input.password,
      firstName: input.firstName,
      lastName: input.lastName,
      emailVerified: false,
    };
    db.users.push(newUser);
    const session: AuthSession = {
      user: { id: newUser.id, email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName, emailVerified: false },
      token: generateId('token'),
      createdAt: new Date().toISOString(),
    };
    db.session = session;
    await store.write(db);
    return delay(session);
  }

  async logout(): Promise<void> {
    const db = await store.read();
    db.session = null;
    await store.write(db);
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    const db = await store.read();
    return delay(db.session);
  }

  async resetPassword(_email: string): Promise<void> {
    await delay(undefined, 400);
  }

  async verifyEmail(_code: string): Promise<void> {
    const db = await store.read();
    if (db.session) {
      db.session.user.emailVerified = true;
      await store.write(db);
    }
  }

  async getOnboardingComplete(): Promise<boolean> {
    const db = await store.read();
    return delay(db.onboardingComplete, 50);
  }

  async setOnboardingComplete(value: boolean): Promise<void> {
    const db = await store.read();
    db.onboardingComplete = value;
    await store.write(db);
  }
}

export const authRepository: AuthRepository = new MockAuthRepository();
