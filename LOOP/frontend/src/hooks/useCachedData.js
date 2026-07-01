import { useState, useEffect, useCallback } from 'react';

// In-memory cache for fast access
const memoryCache = {};

// Helper to load cache from sessionStorage
const getSessionCache = (key) => {
  try {
    const val = sessionStorage.getItem(`loop_cache_${key}`);
    return val ? JSON.parse(val) : null;
  } catch (e) {
    return null;
  }
};

// Helper to write cache to sessionStorage
const setSessionCache = (key, val) => {
  try {
    sessionStorage.setItem(`loop_cache_${key}`, JSON.stringify(val));
  } catch (e) {
    // Ignore storage limit exceptions
  }
};

export const useCachedData = (key, fetcher, dependencies = []) => {
  // Initialize state with in-memory or sessionStorage cached value
  const [data, setData] = useState(() => {
    if (memoryCache[key]) return memoryCache[key];
    const sessionVal = getSessionCache(key);
    if (sessionVal) {
      memoryCache[key] = sessionVal;
      return sessionVal;
    }
    return null;
  });

  const [loading, setLoading] = useState(() => {
    // If we have cached data, don't show initial loading spinner/skeletons
    return !memoryCache[key];
  });
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setError(null);
    }
    try {
      const res = await fetcher();
      memoryCache[key] = res;
      setSessionCache(key, res);
      setData(res);
      setLoading(false);
      return res;
    } catch (err) {
      console.error(`Error fetching cache for key "${key}":`, err);
      if (!isBackground) {
        setError(err);
      }
      setLoading(false);
      throw err;
    }
  }, [key, fetcher]);

  // Revalidate (background fetch) on mount or dependency changes
  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      // If we don't have cached data, show initial loading state
      const hasCache = !!memoryCache[key];
      if (!hasCache && isMounted) {
        setLoading(true);
      }

      try {
        const res = await fetchData(hasCache); // fetch in background if cache exists
        if (isMounted) {
          setData(res);
        }
      } catch (err) {
        // Errors are already handled inside fetchData
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [key, fetchData, ...dependencies]);

  // Mutate function allows optimistic UI updates
  const mutate = useCallback((newData, revalidate = true) => {
    memoryCache[key] = newData;
    setSessionCache(key, newData);
    setData(newData);
    
    if (revalidate) {
      // Re-fetch in background to synchronize with server
      fetchData(true).catch(() => {});
    }
  }, [key, fetchData]);

  return { data, loading, error, mutate, refresh: () => fetchData(false) };
};

// Global helper to clear all caches (e.g. on logout)
export const clearAllCaches = () => {
  Object.keys(memoryCache).forEach(k => delete memoryCache[k]);
  try {
    Object.keys(sessionStorage).forEach(k => {
      if (k.startsWith('loop_cache_')) {
        sessionStorage.removeItem(k);
      }
    });
  } catch (e) {
    // Ignore storage issues
  }
};
