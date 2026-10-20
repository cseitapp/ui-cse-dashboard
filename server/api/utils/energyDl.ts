import axios from "axios";

const configuredTimeout = Number(process.env.API_ENERGY_TIMEOUT_MS);
const requestTimeout = Number.isFinite(configuredTimeout) && configuredTimeout > 0
  ? configuredTimeout
  : 12_000;

export const energyDl = axios.create({
  baseURL: process.env.API_ENERGY_DL,
  timeout: requestTimeout,
  headers: {
    "x-api-key": process.env.API_KEY_DL,
  },
  transitional: {
    clarifyTimeoutError: true,
  },
});
