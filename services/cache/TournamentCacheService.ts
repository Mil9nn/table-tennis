// services/cache/TournamentCacheService.ts
import { LRUCache } from 'lru-cache';
import { TournamentDTO } from '../tournament/TournamentQueryService';

/**
 * Tournament Cache Service
 *
 * LRU cache for tournament data to reduce database load.
 *
 * Benefits:
 * - Faster response times
 * - Reduced database queries
 * - Lower server load
 * - Automatic eviction of old entries
 *
 * Cache Strategy:
 * - 5-minute TTL for tournament details
 * - 2-minute TTL for tournament lists
 * - Max 500 items in cache
 * - Invalidate on updates
 */

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  max?: number; // Maximum cache size
}

export class TournamentCacheService {
  private tournamentCache: LRUCache<string, TournamentDTO>;
  private listCache: LRUCache<string, TournamentDTO[]>;
  private statsCache: LRUCache<string, any>;

  constructor(options?: CacheOptions) {
    // Tournament details cache (5 minutes TTL)
    this.tournamentCache = new LRUCache({
      max: options?.max || 500,
      ttl: options?.ttl || 1000 * 60 * 5, // 5 minutes
      updateAgeOnGet: true,
      updateAgeOnHas: false
    });

    // List/search results cache (2 minutes TTL)
    this.listCache = new LRUCache({
      max: 100,
      ttl: 1000 * 60 * 2, // 2 minutes
      updateAgeOnGet: true,
      updateAgeOnHas: false
    });

    // Stats cache (3 minutes TTL)
    this.statsCache = new LRUCache({
      max: 200,
      ttl: 1000 * 60 * 3, // 3 minutes
      updateAgeOnGet: true,
      updateAgeOnHas: false
    });
  }

  /**
   * Get tournament from cache or fetch function
   */
  async getTournament(
    id: string,
    fetchFn: () => Promise<TournamentDTO | null>
  ): Promise<TournamentDTO | null> {
    // Check cache first
    const cached = this.tournamentCache.get(id);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const tournament = await fetchFn();
    if (tournament) {
      this.tournamentCache.set(id, tournament);
    }

    return tournament;
  }

  /**
   * Get tournament list from cache or fetch function
   */
  async getTournamentList(
    cacheKey: string,
    fetchFn: () => Promise<TournamentDTO[]>
  ): Promise<TournamentDTO[]> {
    // Check cache
    const cached = this.listCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const tournaments = await fetchFn();
    this.listCache.set(cacheKey, tournaments);

    return tournaments;
  }

  /**
   * Get tournament stats from cache or fetch function
   */
  async getTournamentStats(
    id: string,
    fetchFn: () => Promise<any>
  ): Promise<any> {
    // Check cache
    const cached = this.statsCache.get(id);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const stats = await fetchFn();
    if (stats) {
      this.statsCache.set(id, stats);
    }

    return stats;
  }

  /**
   * Invalidate specific tournament
   */
  invalidateTournament(id: string): void {
    this.tournamentCache.delete(id);
    this.statsCache.delete(id);

    // Also invalidate all list caches since they might contain this tournament
    this.listCache.clear();
  }

  /**
   * Invalidate tournaments matching a pattern
   */
  invalidatePattern(pattern: string): void {
    // Invalidate tournament cache entries matching pattern
    for (const key of this.tournamentCache.keys()) {
      if (key.includes(pattern)) {
        this.tournamentCache.delete(key);
      }
    }

    // Invalidate stats cache
    for (const key of this.statsCache.keys()) {
      if (key.includes(pattern)) {
        this.statsCache.delete(key);
      }
    }

    // Clear list cache
    this.listCache.clear();
  }

  /**
   * Invalidate all tournament caches
   */
  invalidateAll(): void {
    this.tournamentCache.clear();
    this.listCache.clear();
    this.statsCache.clear();
  }

  /**
   * Invalidate list cache
   */
  invalidateListCache(): void {
    this.listCache.clear();
  }

  /**
   * Generate cache key for list queries
   */
  generateListCacheKey(options: {
    status?: string;
    format?: string;
    category?: string;
    city?: string;
    search?: string;
    limit?: number;
    skip?: number;
    sort?: string;
  }): string {
    const parts: string[] = ['list'];

    if (options.status) parts.push(`status:${options.status}`);
    if (options.format) parts.push(`format:${options.format}`);
    if (options.category) parts.push(`category:${options.category}`);
    if (options.city) parts.push(`city:${options.city}`);
    if (options.search) parts.push(`search:${options.search}`);
    if (options.sort) parts.push(`sort:${options.sort}`);
    if (options.limit) parts.push(`limit:${options.limit}`);
    if (options.skip) parts.push(`skip:${options.skip}`);

    return parts.join('|');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      tournaments: {
        size: this.tournamentCache.size,
        max: this.tournamentCache.max
      },
      lists: {
        size: this.listCache.size,
        max: this.listCache.max
      },
      stats: {
        size: this.statsCache.size,
        max: this.statsCache.max
      }
    };
  }

  /**
   * Warm up cache with popular tournaments
   */
  async warmUp(
    popularTournamentIds: string[],
    fetchFn: (id: string) => Promise<TournamentDTO | null>
  ): Promise<void> {
    const promises = popularTournamentIds.map(async (id) => {
      try {
        const tournament = await fetchFn(id);
        if (tournament) {
          this.tournamentCache.set(id, tournament);
        }
      } catch (error) {
        console.error(`Failed to warm up cache for tournament ${id}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Prune old entries manually
   */
  prune(): void {
    this.tournamentCache.purgeStale();
    this.listCache.purgeStale();
    this.statsCache.purgeStale();
  }
}

// Singleton instance for convenience
export const tournamentCacheService = new TournamentCacheService();

/**
 * Cache middleware helper for easy integration
 */
export function withCache<T extends {}>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  cache: LRUCache<string, T>
): Promise<T> {
  const cached = cache.get(cacheKey);
  if (cached) {
    return Promise.resolve(cached);
  }

  return fetchFn().then(result => {
    cache.set(cacheKey, result);
    return result;
  });
}
