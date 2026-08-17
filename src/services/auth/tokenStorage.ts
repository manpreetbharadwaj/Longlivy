import * as SecureStore from 'expo-secure-store';

/**
 * The single place authentication tokens are persisted. Uses the platform
 * keychain/keystore via expo-secure-store rather than AsyncStorage — tokens
 * are more sensitive than the rest of this app's locally-mocked data and
 * deserve encrypted-at-rest storage.
 *
 * Nothing outside this module should read/write these SecureStore keys
 * directly — that's what keeps "where is the token actually stored" a
 * one-file answer.
 */

const ACCESS_TOKEN_KEY = 'longlivy.auth.accessToken';
const REFRESH_TOKEN_KEY = 'longlivy.auth.refreshToken';

export interface TokenPair {
  accessToken: string;
  refreshToken: string | null;
}

async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

async function getTokens(): Promise<TokenPair | null> {
  const [accessToken, refreshToken] = await Promise.all([getAccessToken(), getRefreshToken()]);
  if (!accessToken) return null;
  return { accessToken, refreshToken };
}

async function saveTokens(tokens: TokenPair): Promise<void> {
  const writes = [SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken)];
  if (tokens.refreshToken) writes.push(SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken));
  await Promise.all(writes);
}

/** Updates only the access token — used after a successful refresh when the backend doesn't rotate the refresh token. */
async function updateAccessToken(accessToken: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
}

async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY).catch(() => undefined),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => undefined),
  ]);
}

export const tokenStorage = {
  getAccessToken,
  getRefreshToken,
  getTokens,
  saveTokens,
  updateAccessToken,
  clearTokens,
};
