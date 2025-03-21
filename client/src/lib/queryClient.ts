import { QueryClient } from "@tanstack/react-query";

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

export async function apiRequest(
  method: RequestMethod,
  endpoint: string,
  data?: unknown
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add auth token if available
  const token = localStorage.getItem("auth_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  console.log(`API Request: ${method} ${endpoint}`, data);
  
  const response = await fetch(endpoint, {
    method,
    headers,
    credentials: "include",
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    if (response.status >= 500) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    const errorText = await response.text();
    throw new Error(errorText);
  }

  // Parse the response as JSON
  const result = await response.json();
  console.log(`API Response for ${method} ${endpoint}:`, result);
  
  return result;
}

export function getQueryFn(options?: { on401: "throw" | "returnNull" }) {
  return async (context: { queryKey: unknown }) => {
    try {
      // apiRequest already returns JSON parsed data, so we just return it directly
      const queryKey = context.queryKey as string[];
      return await apiRequest("GET", queryKey[0]);
    } catch (error) {
      if (
        options?.on401 === "returnNull" &&
        error instanceof Error &&
        error.message.includes("401")
      ) {
        return null;
      }
      throw error;
    }
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn(),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    }
  },
});