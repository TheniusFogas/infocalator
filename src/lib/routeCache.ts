 // Client-side caching for routes and searches
 
 const CACHE_PREFIX = 'route_cache_';
 const SEARCH_CACHE_PREFIX = 'search_cache_';
 const ROUTE_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
 const SEARCH_CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour
 
 interface CacheEntry<T> {
   data: T;
   timestamp: number;
   expiry: number;
 }
 
 export interface CachedRoute {
   fromName: string;
   toName: string;
   distance: number;
   duration: number;
   coordinates: [number, number][];
   steps: any[];
   fuelCost: number;
   alternatives?: any[];
 }
 
 export interface CachedSearchResult {
   query: string;
   results: any[];
 }
 
 // Generate cache key for routes
 const getRouteCacheKey = (from: string, to: string): string => {
   return `${CACHE_PREFIX}${from.toLowerCase()}_${to.toLowerCase()}`.replace(/\s+/g, '_');
 };
 
 // Generate cache key for searches
 const getSearchCacheKey = (query: string): string => {
   return `${SEARCH_CACHE_PREFIX}${query.toLowerCase()}`.replace(/\s+/g, '_');
 };
 
 // Save route to cache
 export const cacheRoute = (route: CachedRoute): void => {
   try {
     const key = getRouteCacheKey(route.fromName, route.toName);
     const entry: CacheEntry<CachedRoute> = {
       data: route,
       timestamp: Date.now(),
       expiry: ROUTE_CACHE_EXPIRY
     };
     localStorage.setItem(key, JSON.stringify(entry));
   } catch (e) {
     console.warn('Failed to cache route:', e);
   }
 };
 
 // Get cached route
 export const getCachedRoute = (from: string, to: string): CachedRoute | null => {
   try {
     const key = getRouteCacheKey(from, to);
     const cached = localStorage.getItem(key);
     if (!cached) return null;
     
     const entry: CacheEntry<CachedRoute> = JSON.parse(cached);
     if (Date.now() - entry.timestamp > entry.expiry) {
       localStorage.removeItem(key);
       return null;
     }
     
     return entry.data;
   } catch (e) {
     return null;
   }
 };
 
 // Save search results to cache
 export const cacheSearchResults = (query: string, results: any[]): void => {
   try {
     const key = getSearchCacheKey(query);
     const entry: CacheEntry<CachedSearchResult> = {
       data: { query, results },
       timestamp: Date.now(),
       expiry: SEARCH_CACHE_EXPIRY
     };
     localStorage.setItem(key, JSON.stringify(entry));
   } catch (e) {
     console.warn('Failed to cache search:', e);
   }
 };
 
 // Get cached search results
 export const getCachedSearchResults = (query: string): any[] | null => {
   try {
     const key = getSearchCacheKey(query);
     const cached = localStorage.getItem(key);
     if (!cached) return null;
     
     const entry: CacheEntry<CachedSearchResult> = JSON.parse(cached);
     if (Date.now() - entry.timestamp > entry.expiry) {
       localStorage.removeItem(key);
       return null;
     }
     
     return entry.data.results;
   } catch (e) {
     return null;
   }
 };
 
 // Clear all route caches
 export const clearRouteCache = (): void => {
   try {
     const keys = Object.keys(localStorage);
     keys.forEach(key => {
       if (key.startsWith(CACHE_PREFIX) || key.startsWith(SEARCH_CACHE_PREFIX)) {
         localStorage.removeItem(key);
       }
     });
   } catch (e) {
     console.warn('Failed to clear cache:', e);
   }
 };
 
 // Get recent routes from cache (for quick access)
 export const getRecentRoutes = (limit = 5): CachedRoute[] => {
   try {
     const routes: { route: CachedRoute; timestamp: number }[] = [];
     const keys = Object.keys(localStorage);
     
     keys.forEach(key => {
       if (key.startsWith(CACHE_PREFIX)) {
         try {
           const entry: CacheEntry<CachedRoute> = JSON.parse(localStorage.getItem(key) || '');
           if (Date.now() - entry.timestamp < entry.expiry) {
             routes.push({ route: entry.data, timestamp: entry.timestamp });
           }
         } catch (e) {
           // Skip invalid entries
         }
       }
     });
     
     return routes
       .sort((a, b) => b.timestamp - a.timestamp)
       .slice(0, limit)
       .map(r => r.route);
   } catch (e) {
     return [];
   }
 };