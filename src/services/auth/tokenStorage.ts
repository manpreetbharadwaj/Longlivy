import * as SecureStore from 'expo-secure-store';

/** SecureStore is the sole persistence boundary for the access token. */
const ACCESS_TOKEN_KEY = 'longlivy.auth.accessToken';
const EXPIRES_AT_KEY = 'longlivy.auth.expiresAt';
const USER_KEY = 'longlivy.auth.user';

export interface TokenPair {
  accessToken: string;
  expiresAt: string;
}

export interface StoredAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
}

async function getAccessToken(): Promise<string | null> {
  const [accessToken, expiresAt] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(EXPIRES_AT_KEY),
  ]);
  if (!accessToken) return null;
  // Legacy installs may not have an expiry yet. Allow one authenticated
  // request so GET /auth/me can revalidate the token; all newly-issued tokens
  // always persist the documented expires_at value.
  if (!expiresAt) return accessToken;
  const expiresMs = Date.parse(expiresAt);
  if (!Number.isFinite(expiresMs) || expiresMs <= Date.now()) {
    await clearTokens();
    return null;
  }
  return accessToken;
}

async function getExpiresAt(): Promise<string | null> {
  return SecureStore.getItemAsync(EXPIRES_AT_KEY);
}

async function getTokens(): Promise<TokenPair | null> {
  const [accessToken, expiresAt] = await Promise.all([getAccessToken(), getExpiresAt()]);
  return accessToken && expiresAt ? { accessToken, expiresAt } : null;
}

async function saveTokens(tokens: TokenPair): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
    SecureStore.setItemAsync(EXPIRES_AT_KEY, tokens.expiresAt),
  ]);
}

async function saveUser(user: StoredAuthUser): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

async function getUser(): Promise<StoredAuthUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredAuthUser;
    if (!parsed.id || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function updateAccessToken(accessToken: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
}

async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY).catch(() => undefined),
    SecureStore.deleteItemAsync(EXPIRES_AT_KEY).catch(() => undefined),
    SecureStore.deleteItemAsync(USER_KEY).catch(() => undefined),
  ]);
}

export const tokenStorage = {
  getAccessToken,
  getTokens,
  getExpiresAt,
  saveTokens,
  saveUser,
  getUser,
  updateAccessToken,
  clearTokens,
};
