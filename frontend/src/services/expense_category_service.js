import { api } from "../api/client";

export function getExpenseCategories(activeOnly = false) {
  return api.get(`/expense-categories?active_only=${activeOnly}`);
}

export function createExpenseCategory(data) {
  return api.post("/expense-categories", data);
}

export function updateExpenseCategory(id, data) {
  return api.patch(`/expense-categories/${id}`, data);
}