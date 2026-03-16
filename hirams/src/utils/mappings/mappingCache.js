const CACHE_KEY = "app_mappings";
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export const saveMappings = (data) => {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify({
    data,
    timestamp: Date.now(),
  }));
};

export const loadMappings = () => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

export const clearMappings = () => sessionStorage.removeItem(CACHE_KEY);