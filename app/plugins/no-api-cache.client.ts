import axios from "axios";

// Stop the browser from reusing old dashboard data responses.
// The `_ts` param makes every URL unique; the server cache keys ignore it,
// so the server-side 2-minute cache still works.
export default defineNuxtPlugin(() => {
  axios.interceptors.request.use((config) => {
    const method = (config.method || "get").toLowerCase();
    if (method === "get" && String(config.url || "").startsWith("/api/data/")) {
      config.params = { ...(config.params || {}), _ts: Date.now() };
    }
    return config;
  });
});
