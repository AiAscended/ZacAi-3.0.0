/**
 * CacheManager
 * In-memory cache with LRU (Least Recently Used) eviction policy.
 * Used for fast access to frequently used data (vocab, math, facts, etc.).
 */

type CacheEntry<T> = {
  key: string
  value: T
  timestamp: number
}

export class CacheManager<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map()
  private maxSize: number

  constructor(maxSize: number = 256) {
    this.maxSize = maxSize
  }

  public set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }
    this.cache.set(key, { key, value, timestamp: Date.now() })
    if (this.cache.size > this.maxSize) {
      this.evictLRU()
    }
  }

  public get(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (entry) {
      // Refresh usage
      this.cache.delete(key)
      this.cache.set(key, { ...entry, timestamp: Date.now() })
      return entry.value
    }
    return undefined
  }

  public has(key: string): boolean {
    return this.cache.has(key)
  }

  public delete(key: string): void {
    this.cache.delete(key)
  }

  public clear(): void {
    this.cache.clear()
  }

  public size(): number {
    return this.cache.size
  }

  public keys(): string[] {
    return Array.from(this.cache.keys())
  }

  public stats(): { size: number; maxSize: number } {
    return { size: this.cache.size, maxSize: this.maxSize }
  }

  private evictLRU(): void {
    // Remove the least recently used (oldest timestamp)
    let oldestKey: string | null = null
    let oldestTimestamp = Infinity
    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp
        oldestKey = key
      }
    }
    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }
}
