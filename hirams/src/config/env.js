// Load all environment variables in one place
const isProduction = import.meta.env.PROD;

export const ENV = {
  API_BASE_URL: isProduction
    ? "https://lgu.net.ph/apiHirams/public/api/"
    : "http://127.0.0.1:8000/api/",

  API_MAPPINGS_BASE_URL: isProduction
    ? "https://lgu.net.ph/apiHirams/public/api/mappings"
    : "http://127.0.0.1:8000/api/mappings",

  API_IMAGES: isProduction
    ? "https://lgu.net.ph/apiHirams/"
    : "http://127.0.0.1:8000/",

  PUSHER_APP_KEY: import.meta.env.VITE_PUSHER_APP_KEY,
  PUSHER_APP_CLUSTER: import.meta.env.VITE_PUSHER_APP_CLUSTER,
  RECAPTCHA_SITE_KEY: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
};