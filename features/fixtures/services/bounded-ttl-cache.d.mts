export declare class BoundedTtlCache<T> {
  constructor(maxEntries: number, ttlMs: number);
  get(key: string, now?: number): T | undefined;
  set(key: string, value: T, now?: number): void;
}
