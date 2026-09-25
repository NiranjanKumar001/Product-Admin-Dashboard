import axios from "axios";

// Create a shared Axios instance with the DummyJSON base URL
const api = axios.create({
  baseURL: "https://dummyjson.com",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
