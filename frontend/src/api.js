import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" }
});

export function signup(data) {
  return api.post("/api/auth/signup", data).then((res) => res.data);
}

export function generateOtp(user_id) {
  return api.post("/api/auth/generate-otp", { user_id }).then((res) => res.data);
}

export function verifyOtp(user_id, otp) {
  return api.post("/api/auth/verify-otp", { user_id, otp }).then((res) => res.data);
}

export function login(data) {
  return api.post("/api/auth/login", data).then((res) => res.data);
}
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = "Bearer " + token;
  return config;
});

export default api;
