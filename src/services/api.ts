import axios from "axios"

const isProduction = import.meta.env.MODE === "production"

export const api = axios.create({
  baseURL: isProduction
    ? "https://iplan.onrender.com"
    : "http://localhost:4000",
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
