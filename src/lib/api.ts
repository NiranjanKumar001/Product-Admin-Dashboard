import axios from "axios";

// Create a shared Axios instance with the DummyJSON base URL
const api = axios.create({
  baseURL: "https://dummyjson.com",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: runs before every outgoing request
api.interceptors.request.use(
  (config) => {
    // Basic placeholder structure for authentication:
    // Once login is implemented, we will read the saved token and attach it here.
    // Example:
    // if (typeof window !== "undefined") {
    //   const token = localStorage.getItem("authToken");
    //   if (token) {
    //     config.headers.Authorization = `Bearer ${token}`;
    //   }
    // }

    return config;
  },
  (error) => {
    // Handle errors that occur while setting up the request
    return Promise.reject(error);
  }
);

export default api;

