import { api } from "../api/client";

export async function getInvestments() {
  return api.get("/investments");
}

export async function getInvestment(id) {
  return api.get(`/investments/${id}`);
}

export async function createInvestment(data) {
  return api.post("/investments", data);
}

export async function updateInvestment(id, data) {
  return api.patch(`/investments/${id}`, data);
}

export async function redeemInvestment(id, amount) {
  return api.post(`/investments/${id}/redeem`, { amount });
}