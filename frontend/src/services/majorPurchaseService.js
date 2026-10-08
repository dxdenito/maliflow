
import { api } from "../api/client";

export const getMajorPurchases = () => api.get("/major-purchases");

export const getMajorPurchase = (purchaseId) => api.get(`/major-purchases/${purchaseId}`);

export const createMajorPurchase = (data) => api.post("/major-purchases", data);

export const updateMajorPurchase = (purchaseId, data) => api.patch(`/major-purchases/${purchaseId}`, data);

export const getFinancingAgreements = () => api.get("/financing-agreements");

export const getFinancingAgreement = (agreementId) => api.get(`/financing-agreements/${agreementId}`);

export const getFinancingAgreementForPurchase = (purchaseId) => api.get(`/financing-agreements/purchase/${purchaseId}`);

export const createFinancingAgreement = (data) => api.post("/financing-agreements", data);

export const updateFinancingAgreement = (agreementId, data) => api.patch(`/financing-agreements/${agreementId}`, data);

export const getPurchasePayments = (purchaseId) => api.get(`/major-purchase-payments/purchase/${purchaseId}`);

export const getMajorPurchasePayment = (paymentId) => api.get(`/major-purchase-payments/${paymentId}`);

export const createMajorPurchasePayment = (data) => api.post("/major-purchase-payments", data);

export const getPaymentAllocations = (paymentId) => api.get(`/major-purchase-payments/${paymentId}/allocations`);

