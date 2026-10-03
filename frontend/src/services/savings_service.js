
import { api } from "../api/client";

export function getSavingsBalances() {
  return api.get("/savings");
}

export function depositSavings(amount) {
  return api.post("/savings/deposit", { amount });
}

export function withdrawSavings(amount) {
  return api.post("/savings/withdraw", { amount });
}

export function getSavingsPerformance(year, month) {
  return api.get(`/savings/performance?year=${year}&month=${month}`);
}