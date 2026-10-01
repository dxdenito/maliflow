import { api } from "../api/client";

export function getIncome() {
  return api.get("/income");
}

export function getIncomeById(id) {
  return api.get(`/income/${id}`);
}

export function createIncome(data) {
  return api.post("/income", data);
}

export function updateIncome(id, data) {
  return api.patch(`/income/${id}`, data);
}

export function deleteIncome(id) {
  return api.delete(`/income/${id}`);
}