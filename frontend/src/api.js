import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = "Bearer " + token;
  return cfg;
});

export async function signup(data) {
  return (await api.post("/api/auth/signup", data)).data;
}

export async function generateOtp(user_id) {
  return (await api.post("/api/auth/generate-otp", { user_id })).data;
}
export async function verifyOtp({ user_id, otp }) {
  try {
    const res = await api.post("/api/auth/verify-otp", {
      user_id,   // NOT nested!
      otp
    });
    return res.data;
  } catch (err) {
    console.error("Verify OTP API Error:", err);
    return { error: true };
  }
}


export async function login(data) {
  return (await api.post("/api/auth/login", data)).data;
}

export default api;
