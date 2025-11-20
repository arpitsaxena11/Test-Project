// frontend/src/api.js
import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export default api;

export async function signup(payload) {
  const { data } = await api.post("/api/auth/signup", payload);
  return data;
}

export async function generateOtp(user_id, email) {
  const { data } = await api.post("/api/auth/generate-otp", { user_id, email });
  return data;
}

export async function verifyOtp({ user_id, otp }) {
  const { data } = await api.post("/api/auth/verify-otp", { user_id, otp });
  return data;
}

export async function checkWebsite(url) {
  const { data } = await api.post("/api/auth/verify-website", { url });
  return data;
}

export async function getStates() {
  const { data } = await api.get("/api/auth/get-states");
  return data;
}
export const login = async (payload) => {
  const { data } = await api.post("/api/auth/login", payload);
  return data;
};
