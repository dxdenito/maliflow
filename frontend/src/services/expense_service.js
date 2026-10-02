import { api } from "../api/client";

export function getExpenses() {
  return api.get("/expenses");
}

export function createExpense(data) {
  return api.post("/expenses", data);
}

export function updateExpense(id, data) {
  return api.patch(`/expenses/${id}`, data);
}

export function deleteExpense(id) {
  return api.delete(`/expenses/${id}`);
}