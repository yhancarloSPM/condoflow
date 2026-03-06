import { Injectable } from '@angular/core';

interface CacheEntry {
  response: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultCacheDuration = 30000; // 30 segundos

  get(url: string, cacheDuration: number = this.defaultCacheDuration): any | null {
    const entry = this.cache.get(url);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const isExpired = (now - entry.timestamp) > cacheDuration;

    if (isExpired) {
      this.cache.delete(url);
      return null;
    }

    return entry.response;
  }

  set(url: string, response: any): void {
    this.cache.set(url, {
      response,
      timestamp: Date.now()
    });
  }

  clear(url?: string): void {
    if (url) {
      this.cache.delete(url);
    } else {
      this.cache.clear();
    }
  }

  clearByPattern(pattern: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}
