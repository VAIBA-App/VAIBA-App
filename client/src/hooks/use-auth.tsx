import React, { ReactNode, createContext, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { useToast } from "./use-toast";
import { create } from 'zustand';
import { queryClient } from "../lib/queryClient";

// Types
type User = {
  id: number;
  email: string;
  name: string;
  role?: string;
};

type LoginCredentials = {
  email: string;
  password: string;
};

type RegisterData = LoginCredentials & {
  name: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<any, Error, LoginCredentials>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<any, Error, RegisterData>;
  token: string | null;
};

// Create zustand store
interface AuthStore {
  token: string | null;
  setToken: (token: string | null) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: localStorage.getItem('token'), // Initialize from localStorage
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
      console.log('Token stored:', token.substring(0, 10) + '...');
    } else {
      localStorage.removeItem('token');
      console.log('Token removed');
    }
    set({ token });
  },
  initialize: () => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Token initialized from storage:', token.substring(0, 10) + '...');
      set({ token });
    }
  },
}));

// Create context
export const AuthContext = createContext<AuthContextType | null>(null);

// Create provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { token, setToken } = useAuthStore();

  // Initialize auth state on mount
  React.useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  const {
    data: user,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      if (!token) {
        console.log('No token available, skipping user fetch');
        return null;
      }

      console.log('Fetching user with token:', token.substring(0, 10) + '...');
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Token invalid or expired, clearing auth state');
          setToken(null);
          return null;
        }
        throw new Error('Failed to fetch user');
      }

      const userData = await response.json();
      console.log('User data fetched successfully:', userData);
      return userData;
    },
    retry: false,
    enabled: !!token,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      console.log('Attempting login');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login fehlgeschlagen');
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log('Login successful, setting token');
      setToken(data.token);
      queryClient.setQueryData(["/api/auth/user"], data.user);
      toast({
        title: "Erfolgreich angemeldet",
        description: "Willkommen zurück!",
      });
    },
    onError: (error: Error) => {
      console.error('Login failed:', error);
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      console.log('Attempting registration');
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registrierung fehlgeschlagen');
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log('Registration successful, setting token');
      setToken(data.token);
      queryClient.setQueryData(["/api/auth/user"], data.user);
      toast({
        title: "Registrierung erfolgreich",
        description: "Ihr Konto wurde erstellt!",
      });
    },
    onError: (error: Error) => {
      console.error('Registration failed:', error);
      toast({
        title: "Registrierung fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        console.log('No token available for logout');
        return;
      }

      console.log('Attempting logout');
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Logout fehlgeschlagen');
      }
    },
    onSuccess: () => {
      console.log('Logout successful, clearing auth state');
      setToken(null);
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
      toast({
        title: "Erfolgreich abgemeldet",
        description: "Auf Wiedersehen!",
      });
    },
    onError: (error: Error) => {
      console.error('Logout failed:', error);
      toast({
        title: "Abmeldung fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
      // Force logout even if the API call fails
      setToken(null);
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  return React.createElement(AuthContext.Provider, {
    value: {
      user,
      isLoading,
      error,
      loginMutation,
      logoutMutation,
      registerMutation,
      token,
    },
    children,
  });
}

// Hook for consuming auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}