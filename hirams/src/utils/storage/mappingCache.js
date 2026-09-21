import { getItem, setItem, removeItem } from "../storage/localStorage";

const CACHE_KEY = "app_mappings";

export const saveMappings = (data) => {
  setItem(CACHE_KEY, data);
};

export const loadMappings = () => {
  return getItem(CACHE_KEY, null);
};

export const clearMappings = () => removeItem(CACHE_KEY);