import { ReactNode, createContext, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  loginMutation: any;
  logoutMutation: any;
  registerMutation: any;
  token: string | null;
};

// Create zustand store
interface AuthStore {
  token: string | null;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },
}));

// Create context
export const AuthContext = createContext<AuthContextType | null>(null);

// Create provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { token, setToken } = useAuthStore();

  const {
    data: user,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      if (!token) return null;

      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setToken(null);
          return null;
        }
        throw new Error('Failed to fetch user');
      }

      return response.json();
    },
    retry: false,
    enabled: !!token,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
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
      setToken(data.token);
      queryClient.setQueryData(["/api/auth/user"], data.user);
      toast({
        title: "Erfolgreich angemeldet",
        description: "Willkommen zurück!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
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
      setToken(data.token);
      queryClient.setQueryData(["/api/auth/user"], data.user);
      toast({
        title: "Registrierung erfolgreich",
        description: "Ihr Konto wurde erstellt!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registrierung fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      setToken(null);
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
    },
    onSuccess: () => {
      toast({
        title: "Erfolgreich abgemeldet",
        description: "Auf Wiedersehen!",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook for consuming auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}