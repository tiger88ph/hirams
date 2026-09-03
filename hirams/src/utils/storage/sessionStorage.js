export const setItem = (key, value) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Could not set sessionStorage item "${key}":`, e);
  }
};

export const getItem = (key, fallback = null) => {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn(`Could not get sessionStorage item "${key}":`, e);
    return fallback;
  }
};

export const removeItem = (key) => {
  try {
    sessionStorage.removeItem(key);
  } catch (e) {
    console.warn(`Could not remove sessionStorage item "${key}":`, e);
  }
};

export const clearAll = () => {
  try {
    sessionStorage.clear();
  } catch (e) {
    console.warn("Could not clear sessionStorage:", e);
  }
};