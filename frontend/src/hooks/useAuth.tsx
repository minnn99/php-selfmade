import { useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";

interface User {
  id: number;
  name: string;
  email: string;
}

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkInitialAuth = useCallback(async () => {
    try {
      const isAuth = authAPI.isAuthenticated();

      if (isAuth) {
        const currentUser = authAPI.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);

          // Start token expiration checker
          authAPI.startTokenChecker();
        } else {
          // Try to fetch user from server
          try {
            const response = await authAPI.getUser();
            if (response.success) {
              const responseData = response.data as { user: { id: number; name: string; email: string } };
              setUser(responseData.user);
              setIsAuthenticated(true);
              authAPI.startTokenChecker();
            }
          } catch {
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize authentication state
  useEffect(() => {
    checkInitialAuth();
  }, [checkInitialAuth]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login(email, password);

      if (response.success) {
        const responseData = response.data as { user: { id: number; name: string; email: string } };
        setUser(responseData.user);
        setIsAuthenticated(true);
        authAPI.startTokenChecker();
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authAPI.logout();
    } catch {
      // Silent error handling - logout API call failed
    } finally {
      authAPI.stopTokenChecker();
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const refreshAuth = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    await checkInitialAuth();
  }, [checkInitialAuth]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshAuth,
  };
};

// Route protection hook
export const useRequireAuth = (redirectTo: string = "/") => {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Store the attempted URL for redirect after login
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== "/" && currentPath !== "/login") {
        sessionStorage.setItem("redirectAfterLogin", currentPath);
      }

      // Redirect to login
      window.location.href = redirectTo;
    }
  }, [auth.isAuthenticated, auth.isLoading, redirectTo]);

  return auth;
};
