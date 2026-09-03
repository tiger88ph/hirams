const PREFIX = "hirams_";

function buildKey(key) {
  return `${PREFIX}${key}`;
}

/**
 * Get a value from localStorage, JSON-parsed.
 * Returns `fallback` if the key doesn't exist or parsing fails.
 */
export function getItem(key, fallback = null) {
  const fullKey = buildKey(key);
  try {
    const raw = localStorage.getItem(fullKey);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[Storage] GET "${fullKey}" → FAILED`, err);
    return fallback;
  }
}

/**
 * Store a value in localStorage (JSON-stringified).
 * Returns true on success, false on failure (quota exceeded, disabled, etc).
 */
export function setItem(key, value) {
  const fullKey = buildKey(key);
  try {
    localStorage.setItem(fullKey, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[Storage] SET "${fullKey}" → FAILED`, err);
    return false;
  }
}

/**
 * Remove a single key.
 */
export function removeItem(key) {
  const fullKey = buildKey(key);
  try {
    localStorage.removeItem(fullKey);
    return true;
  } catch (err) {
    console.error(`[Storage] REMOVE "${fullKey}" → FAILED`, err);
    return false;
  }
}

/**
 * Remove all keys under this app's prefix.
 */
export function clearAll() {
  try {
    const allKeys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
    allKeys.forEach((k) => localStorage.removeItem(k));
    return true;
  } catch (err) {
    console.error(`[Storage] CLEAR → FAILED`, err);
    return false;
  }
}

/**
 * Check if a key exists.
 */
export function hasItem(key) {
  const fullKey = buildKey(key);
  try {
    return localStorage.getItem(fullKey) !== null;
  } catch (err) {
    console.error(`[Storage] EXISTS "${fullKey}" → FAILED`, err);
    return false;
  }
}
