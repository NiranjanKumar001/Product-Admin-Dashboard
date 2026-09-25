import api from "@/lib/api";

export interface LoginCredentials {
  username: string;
  password: string;
}

// Function to call the DummyJSON login endpoint
export async function loginUser(credentials: LoginCredentials) {
  const response = await api.post("/auth/login", credentials);
  return response.data;
}
