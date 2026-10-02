
import { api } from "../api/client";

export function getBudgets() {
  return api.get("/budgets");
}

export function createBudget(data) {
  return api.post("/budgets", data);
}

export function updateBudget(id, data) {
  return api.patch(`/budgets/${id}`, data);
}

export function deleteBudget(id) {
  return api.delete(`/budgets/${id}`);
}

export function getBudgetActual(id) {
  return api.get(`/budgets/${id}/actual`);
}