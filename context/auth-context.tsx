import React, { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "../services/api";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address?: any;
  emergencyContact?: any;
  profileImage?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  register: (userData: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUser: (
    userData: any,
  ) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app start
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setIsLoading(true);
    try {
      const response = await authAPI.getProfile();
      if (response.success) {
        setUser(response.data.user);
        // Token is already stored and sent with the request
      } else if (response.requiresAuth) {
        console.log("[Auth] Authentication required, no token provided");
        // Don't logout, just set user to null
        setUser(null);
      }
    } catch (error: any) {
      // Only logout if it's a genuine auth error, not a missing token scenario
      if (error.message && !error.message.includes("No token provided")) {
        console.log("[Auth] Invalid token, logging out...");
        await authAPI.logout();
      } else {
        console.log("[Auth] No token found, user not logged in");
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      if (response.success) {
        setUser(response.data.user);
        setToken(response.data.token);
        return { success: true };
      }
      return { success: false, message: response.message || "Login failed" };
    } catch (error: any) {
      return { success: false, message: error.message || "Login failed" };
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await authAPI.register(userData);
      if (response.success) {
        setUser(response.data.user);
        setToken(response.data.token);
        return { success: true };
      }
      return {
        success: false,
        message: response.message || "Registration failed",
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Registration failed",
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setToken(null);
    }
  };

  const updateUser = async (userData: any) => {
    try {
      const response = await authAPI.updateProfile(userData);
      if (response.success) {
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, message: response.message || "Update failed" };
    } catch (error: any) {
      return { success: false, message: error.message || "Update failed" };
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
