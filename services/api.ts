import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "http://localhost:5002/api";

// ─── Token Helpers ────────────────────────────────────────────────────────────

const storeToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync("authToken", token);
    console.log("[Auth] Token stored successfully");
  } catch (error) {
    console.error("[Auth] Error storing token:", error);
  }
};

const getToken = async (): Promise<string | null> => {
  try {
    const token = await SecureStore.getItemAsync("authToken");
    console.log("[Auth] Token retrieved:", token ? "✓ present" : "✗ null");
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

// ─── Extract token from any known response shape ──────────────────────────────

const extractToken = (data: any): string | null => {
  return (
    data?.token ||
    data?.accessToken ||
    data?.access_token ||
    data?.data?.token ||
    data?.data?.accessToken ||
    data?.data?.access_token ||
    null
  );
};

// ─── Core Request ─────────────────────────────────────────────────────────────

const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  requiresAuth = true,
): Promise<any> => {
  try {
    const token = requiresAuth ? await getToken() : null;

    if (requiresAuth && !token) {
      console.warn(`[API] No token available for protected route: ${endpoint}`);
    }

    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    };

    console.log(`[API] ${options.method || "GET"} ${endpoint}`);
    if (options.body) {
      console.log(`[API] Request body:`, options.body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    console.log(`[API] Response status: ${response.status}`);
    console.log(
      `[API] Response headers:`,
      Object.fromEntries(response.headers.entries()),
    );

    let data: any;
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.warn("[API] Non-JSON response:", text);
      data = { message: text };
    }

    console.log(`[API] Response data:`, JSON.stringify(data, null, 2));

    if (!response.ok) {
      const errorMessage =
        data?.message ||
        data?.error ||
        data?.msg ||
        `Request failed with status ${response.status}`;

      // For 401 errors, handle gracefully without error logging
      if (response.status === 401) {
        console.warn(`[API] Authentication required for ${endpoint}`);
        // Return a structured error that the auth context can handle
        return { success: false, message: errorMessage, requiresAuth: true };
      }

      // For other errors, log as error and throw
      console.error(`[API] Error ${response.status}:`, errorMessage);
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error(`[API] Request error on ${endpoint}:`, error);
    throw error;
  }
};

// ─── Auth APIs ────────────────────────────────────────────────────────────────

export const authAPI = {
  register: async (userData: {
    name?: string;
    email: string;
    password: string;
    [key: string]: any;
  }) => {
    const data = await apiRequest(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(userData),
      },
      false,
    );

    console.log("[Auth] Register response:", JSON.stringify(data));

    const token = extractToken(data);
    if (token) {
      await storeToken(token);
    } else {
      console.warn("[Auth] No token found in register response");
    }

    return data;
  },

  login: async (email: string, password: string) => {
    const data = await apiRequest(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
      false,
    );

    console.log("[Auth] Login response:", JSON.stringify(data));

    const token = extractToken(data);
    if (token) {
      await storeToken(token);
    } else {
      console.warn("[Auth] No token found in login response. Check API shape.");
    }

    return data;
  },

  getProfile: async () => {
    return apiRequest("/auth/me");
  },

  updateProfile: async (profileData: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    [key: string]: any;
  }) => {
    return apiRequest("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  },

  logout: async () => {
    await removeToken();
  },

  isLoggedIn: async (): Promise<boolean> => {
    const token = await getToken();
    return !!token;
  },
};

// ─── Medication APIs ──────────────────────────────────────────────────────────

export const medicationAPI = {
  getAll: async (params?: Record<string, string>) => {
    const queryString = params
      ? `?${new URLSearchParams(params).toString()}`
      : "";
    return apiRequest(`/medications${queryString}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/medications/${id}`);
  },

  getCategories: async () => {
    return apiRequest("/medications/categories/all");
  },

  addReview: async (
    medicationId: string,
    review: { rating: number; comment?: string },
  ) => {
    return apiRequest(`/medications/${medicationId}/reviews`, {
      method: "POST",
      body: JSON.stringify(review),
    });
  },
};

// ─── Order APIs ───────────────────────────────────────────────────────────────

export const orderAPI = {
  create: async (orderData: {
    items: {
      medication: string;
      quantity: number;
      price: number;
      dose: string;
    }[];
    shippingAddress?: string;
    [key: string]: any;
  }) => {
    return apiRequest("/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  },

  getUserOrders: async (params?: Record<string, string>) => {
    const queryString = params
      ? `?${new URLSearchParams(params).toString()}`
      : "";
    return apiRequest(`/orders${queryString}`);
  },

  getOrderById: async (id: string) => {
    return apiRequest(`/orders/${id}`);
  },

  cancelOrder: async (id: string) => {
    return apiRequest(`/orders/${id}/cancel`, {
      method: "PUT",
    });
  },
};

// ─── User Medication APIs ─────────────────────────────────────────────────────

export const userMedicationAPI = {
  getAll: async (isActive = true) => {
    return apiRequest(`/users/medications?isActive=${isActive}`);
  },

  add: async (medicationData: {
    medicationId: string;
    dosage?: string;
    frequency?: string;
    startDate?: string;
    endDate?: string;
    [key: string]: any;
  }) => {
    return apiRequest("/users/medications", {
      method: "POST",
      body: JSON.stringify(medicationData),
    });
  },

  update: async (id: string, medicationData: Record<string, any>) => {
    return apiRequest(`/users/medications/${id}`, {
      method: "PUT",
      body: JSON.stringify(medicationData),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/users/medications/${id}`, {
      method: "DELETE",
    });
  },

  markTaken: async (id: string, taken: boolean, time?: string) => {
    return apiRequest(`/users/medications/${id}/taken`, {
      method: "PUT",
      body: JSON.stringify({ taken, ...(time ? { time } : {}) }),
    });
  },

  getDashboard: async () => {
    return apiRequest("/users/dashboard");
  },
};

// ─── Health Check ─────────────────────────────────────────────────────────────

export const healthCheck = async () => {
  return apiRequest("/health", {}, false);
};

// ─── Default Export ───────────────────────────────────────────────────────────

export default {
  authAPI,
  medicationAPI,
  orderAPI,
  userMedicationAPI,
  healthCheck,
};
