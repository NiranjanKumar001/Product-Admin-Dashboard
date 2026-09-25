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

// Response interceptor: runs on every incoming response or response error
api.interceptors.response.use(
  (response) => {
    // If the request was successful (HTTP status 2xx), return the response data
    return response;
  },
  (error) => {
    // Basic centralized error handling
    if (error.response) {
      const status = error.response.status;

      // Handle 401 Unauthorized (e.g. invalid or expired token)
      if (status === 401) {
        console.warn("Unauthorized access (401). Please check your credentials or log in again.");
      }

      // Handle 500 Internal Server Error
      if (status >= 500) {
        console.error("Server error. Please try again later.");
      }
    } else if (error.request) {
      // The request was sent but no response was received (e.g. network offline)
      console.error("Network error: Could not reach the server.");
    }

    // Forward the error to the calling function so it can handle it if needed
    return Promise.reject(error);
  }
);

export default api;


