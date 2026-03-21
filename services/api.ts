import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// ─── Base URL ─────────────────────────────────────────────────────────────────

const getBaseUrl = (): string => {
  const debuggerHost =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    "";

  const isSimulator =
    debuggerHost.startsWith("localhost") ||
    debuggerHost.startsWith("127.0.0.1") ||
    debuggerHost === "";

  // iOS Simulator → localhost
  if (Platform.OS === "ios" && isSimulator) {
    console.log("[API] iOS Simulator → http://localhost:5002/api");
    return "http://localhost:5002/api";
  }

  // Android Emulator → special loopback alias
  if (Platform.OS === "android" && isSimulator) {
    console.log("[API] Android Emulator → http://10.0.2.2:5002/api");
    return "http://10.0.2.2:5002/api";
  }

  // Physical device → use the LAN IP Expo is broadcasting on
  if (debuggerHost) {
    const host = debuggerHost.split(":")[0];
    console.log(`[API] Physical device → http://${host}:5002/api`);
    return `http://${host}:5002/api`;
  }

  console.log("[API] Fallback → localhost");
  return "http://localhost:5002/api";
};

const API_BASE_URL = getBaseUrl();

// ─── Token Helpers ────────────────────────────────────────────────────────────

const storeToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync("authToken", token);
    console.log("[Auth] Token stored");
  } catch (error) {
    console.error("[Auth] Error storing token:", error);
  }
};

const getToken = async (): Promise<string | null> => {
  try {
    const token = await SecureStore.getItemAsync("authToken");
    console.log("[Auth] Token:", token ? "✓ present" : "✗ null");
    return token;
  } catch (error) {
    console.error("[Auth] Error getting token:", error);
    return null;
  }
};

const removeToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync("authToken");
    console.log("[Auth] Token removed");
  } catch (error) {
    console.error("[Auth] Error removing token:", error);
  }
};

const extractToken = (data: any): string | null =>
  data?.token ||
  data?.accessToken ||
  data?.access_token ||
  data?.data?.token ||
  data?.data?.accessToken ||
  data?.data?.access_token ||
  null;

// ─── Core Request ─────────────────────────────────────────────────────────────

const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  requiresAuth = true,
): Promise<any> => {
  try {
    const token = requiresAuth ? await getToken() : null;

    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    };

    const fullUrl = `${API_BASE_URL}${endpoint}`;
    console.log(`[API] ${options.method || "GET"} ${fullUrl}`);

    const response = await fetch(fullUrl, config);
    console.log(`[API] Status: ${response.status}`);

    let data: any;
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.warn("[API] Non-JSON response:", text);
      data = { message: text };
    }

    if (!response.ok) {
      const errorMessage =
        data?.message || data?.error || `HTTP ${response.status}`;

      if (response.status === 401) {
        return { success: false, message: errorMessage, requiresAuth: true };
      }

      throw new Error(errorMessage);
    }

    return data;
  } catch (error: any) {
    if (
      error.message === "Network request failed" ||
      error.message?.includes("fetch")
    ) {
      throw new Error(
        "Cannot reach the server.\n\n" +
          "Simulator: make sure backend is running on port 5002.\n" +
          "Physical device: phone must be on the same Wi-Fi as your computer.",
      );
    }
    throw error;
  }
};

// ─── Auth APIs ────────────────────────────────────────────────────────────────

export const authAPI = {
  register: async (userData: {
    email: string;
    password: string;
    [key: string]: any;
  }) => {
    const data = await apiRequest(
      "/auth/register",
      { method: "POST", body: JSON.stringify(userData) },
      false,
    );
    const token = extractToken(data);
    if (token) await storeToken(token);
    return data;
  },

  login: async (email: string, password: string) => {
    const data = await apiRequest(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      false,
    );
    const token = extractToken(data);
    if (token) await storeToken(token);
    return data;
  },

  getProfile: async () => apiRequest("/auth/me"),

  updateProfile: async (profileData: Record<string, any>) =>
    apiRequest("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    }),

  logout: async () => removeToken(),

  isLoggedIn: async (): Promise<boolean> => !!(await getToken()),
};

// ─── Medication APIs ──────────────────────────────────────────────────────────

export const medicationAPI = {
  getAll: async (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return apiRequest(`/medications${qs}`);
  },
  getById: async (id: string) => apiRequest(`/medications/${id}`),
  getCategories: async () => apiRequest("/medications/categories/all"),
  addReview: async (
    medicationId: string,
    review: { rating: number; comment?: string },
  ) =>
    apiRequest(`/medications/${medicationId}/reviews`, {
      method: "POST",
      body: JSON.stringify(review),
    }),
};

// ─── Order APIs ───────────────────────────────────────────────────────────────

export const orderAPI = {
  create: async (orderData: {
    items: {
      medication?: string;
      name?: string;
      quantity: number;
      price: number;
      dose?: string;
    }[];
    deliveryAddress?: any;
    phoneNumber?: string;
    totalAmount?: number;
    [key: string]: any;
  }) =>
    apiRequest("/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    }),

  getUserOrders: async (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return apiRequest(`/orders${qs}`);
  },

  getOrderById: async (id: string) => apiRequest(`/orders/${id}`),

  cancelOrder: async (id: string) =>
    apiRequest(`/orders/${id}/cancel`, { method: "PUT" }),

  clearOrderHistory: async () =>
    apiRequest("/orders/clear", { method: "DELETE" }),
};

// ─── User Medication APIs ─────────────────────────────────────────────────────

export const userMedicationAPI = {
  getAll: async (isActive = true) =>
    apiRequest(`/users/medications?isActive=${isActive}`),

  add: async (medicationData: Record<string, any>) =>
    apiRequest("/users/medications", {
      method: "POST",
      body: JSON.stringify(medicationData),
    }),

  update: async (id: string, data: Record<string, any>) =>
    apiRequest(`/users/medications/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: async (id: string) =>
    apiRequest(`/users/medications/${id}`, { method: "DELETE" }),

  markTaken: async (id: string, taken: boolean, time?: string) =>
    apiRequest(`/users/medications/${id}/taken`, {
      method: "PUT",
      body: JSON.stringify({ taken, ...(time ? { time } : {}) }),
    }),

  getDashboard: async () => apiRequest("/users/dashboard"),
};

// ─── Health Check ─────────────────────────────────────────────────────────────

export const healthCheck = async () => apiRequest("/health", {}, false);

export default {
  authAPI,
  medicationAPI,
  orderAPI,
  userMedicationAPI,
  healthCheck,
};
