import * as SecureStore from 'expo-secure-store';

/** SecureStore is the sole persistence boundary for the access token. */
const ACCESS_TOKEN_KEY = 'longlivy.auth.accessToken';
const USER_KEY = 'longlivy.auth.user';

export interface TokenPair {
  accessToken: string;
}

export interface StoredAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
}

async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

async function getTokens(): Promise<TokenPair | null> {
  const accessToken = await getAccessToken();
  return accessToken ? { accessToken } : null;
}

async function saveTokens(tokens: TokenPair): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
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
    SecureStore.deleteItemAsync(USER_KEY).catch(() => undefined),
  ]);
}

export const tokenStorage = {
  getAccessToken,
  getTokens,
  saveTokens,
  saveUser,
  getUser,
  updateAccessToken,
  clearTokens,
};
