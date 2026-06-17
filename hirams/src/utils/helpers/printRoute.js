// utils/helpers/printRoute.js
const BASE = import.meta.env.MODE === "production" ? "/hirams" : "";
export const printRoute = (path) => window.open(`${BASE}${path}`, "_blank");