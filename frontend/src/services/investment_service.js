import { api } from "../api/client";

export async function getInvestments() {
  return api.get("/investments");
}

export async function getInvestment(id) {
  return api.get(`/investments/${id}`);
}

export async function getInvestmentTransactions(id) {
  return api.get(`/investments/${id}/transactions`);
}

export async function createInvestment(data) {
  return api.post("/investments", data);
}

export async function updateInvestment(id, data) {
  return api.patch(`/investments/${id}`, data);
}

export async function contributeToInvestment(id, amount) {
  return api.post(
    `/investments/${id}/contributions`,
    { amount }
  );
}

export async function updateInvestmentValuation(
  id,
  currentValue
) {
  return api.post(
    `/investments/${id}/valuation`,
    {
      current_value: currentValue,
    }
  );
}

export async function withdrawFromInvestment(
  id,
  amount
) {
  return api.post(
    `/investments/${id}/withdraw`,
    { amount }
  );
}