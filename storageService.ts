const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const storageService = {
  get<T>(key: string): T | null {
    if (!isBrowser) return null;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      console.error('Failed to read from storage', error);
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to write to storage', error);
    }
  },

  remove(key: string): void {
    if (!isBrowser) return;
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from storage', error);
    }
  },

  clearAll(): void {
    if (!isBrowser) return;
    try {
      window.localStorage.clear();
    } catch (error) {
      console.error('Failed to clear storage', error);
    }
  },
};

export default storageService;
