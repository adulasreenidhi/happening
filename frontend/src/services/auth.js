import api from "./api";

export function registerUser(user) {
  return api.post("/auth/register", user);
}

export function loginUser(credentials) {
  return api.post("/auth/login", credentials);
}
