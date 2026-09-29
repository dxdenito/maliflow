import { api } from "../api/client";

export function getCurrentUser() {
  return api.get("/auth/me");
}

export function loginUser(credentials) {
  return api.post("/auth/login", credentials);
}

export function registerUser(userData) {
  return api.post("/auth/register", userData);
}

export function logoutUser() {
  return api.post("/auth/logout");
}