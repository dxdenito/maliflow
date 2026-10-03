
import { api } from "../api/client";

export function getObligations() {
  return api.get("/obligations");
}

export function createObligation(data) {
  return api.post("/obligations", data);
}

export function repayObligation(id, amount) {
  return api.post(`/obligations/${id}/repayments`, { amount });
}