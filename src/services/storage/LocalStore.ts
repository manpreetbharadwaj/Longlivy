import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Thin JSON persistence helper used by mock repositories so the prototype
 * survives app restarts. Real API repositories will not use this at all.
 */
export class LocalStore<T> {
  private cache: T | undefined;
  private static instances: LocalStore<unknown>[] = [];

  constructor(private key: string, private defaultValue: T) {
    LocalStore.instances.push(this as LocalStore<unknown>);
  }

  async read(): Promise<T> {
    if (this.cache !== undefined) return this.cache;
    try {
      const raw = await AsyncStorage.getItem(this.key);
      this.cache = raw ? (JSON.parse(raw) as T) : this.defaultValue;
    } catch {
      this.cache = this.defaultValue;
    }
    return this.cache;
  }

  async write(value: T): Promise<void> {
    this.cache = value;
    try {
      await AsyncStorage.setItem(this.key, JSON.stringify(value));
    } catch {
      // best-effort local persistence only
    }
  }

  /** Wipes this store's persisted value and resets its in-memory cache. */
  async clear(): Promise<void> {
    this.cache = this.defaultValue;
    try {
      await AsyncStorage.removeItem(this.key);
    } catch {
      // best-effort local persistence only
    }
  }

  /**
   * Deletion (GDPR right-to-erasure) for every mock repository at once — the
   * closest a local-only prototype can get to "delete my data" without a
   * real backend. Every LocalStore instance registers itself on
   * construction, so this doesn't need each repository to expose its own
   * store.
   */
  static async clearAll(): Promise<void> {
    await Promise.all(LocalStore.instances.map((store) => store.clear()));
  }
}
