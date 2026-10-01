import { api } from "../api/client";

export function getFinancialPosition() {
  return api.get("/financial-position");
}