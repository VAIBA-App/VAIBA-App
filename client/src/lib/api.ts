import { Customer, Call, Profile, Conversation } from '@db/schema';
import { useAuthStore } from '@/hooks/use-auth';

const API_BASE = '/api';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

// Profile endpoints
export const profileApi = {
  getAll: () => fetchApi<Profile[]>('/profiles'),
  get: (id: number) => fetchApi<Profile>(`/profiles/${id}`),
  getActive: () => fetchApi<Profile>('/profile'),
  create: (data: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>) =>
    fetchApi<Profile>('/profiles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Profile>) =>
    fetchApi<Profile>(`/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  setActive: (profileId: number) =>
    fetchApi<Profile>('/profiles/active', {
      method: 'POST',
      body: JSON.stringify({ profileId }),
    }),
  delete: (id: number) =>
    fetchApi(`/profiles/${id}`, {
      method: 'DELETE',
    }),
};

// Stats type definition
export type Stats = {
  totalCalls: number;
  positiveRate: number;
  averageDuration: number;
  callsByStatus: {
    positive: number;
    negative: number;
    neutral: number;
    active: number;
  };
};

// Stats endpoints
export const statsApi = {
  get: () => fetchApi<Stats>('/stats'),
};

// Assistant profile endpoints
export const assistantProfileApi = {
  get: () => fetchApi<{id: number, name: string, profile_image: string}>('/assistant-profile'),
  update: async (data: {name: string, profile_image: string}) => {
    try {
      const response = await fetchApi<{id: number, name: string, profile_image: string}>(
        '/assistant-profile',
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      );
      return response;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }
};

// Customer endpoints
export const customerApi = {
  getAll: () => fetchApi<Customer[]>('/customers'),
  get: (id: number) => fetchApi<Customer>(`/customers/${id}`),
  create: (data: Omit<Customer, 'id'>) =>
    fetchApi<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Customer>) =>
    fetchApi<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    fetchApi(`/customers/${id}`, {
      method: 'DELETE',
    }),
};

// Call endpoints
export const callApi = {
  getAll: () => fetchApi<Call[]>('/calls'),
  get: (id: number) => fetchApi<Call>(`/calls/${id}`),
  create: (data: Omit<Call, 'id'>) =>
    fetchApi<Call>('/calls', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getByCustomer: (customerId: number) =>
    fetchApi<Call[]>(`/customers/${customerId}/calls`),
};

// Conversation endpoints
export const conversationApi = {
  getAll: () => fetchApi<Conversation[]>('/conversations'),
  get: (id: number) => fetchApi<Conversation>(`/conversations/${id}`),
  create: async (data: Omit<Conversation, 'id'>) => {
    console.log("Creating conversation with data:", data);
    return fetchApi<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getByCustomer: (customerId: number) =>
    fetchApi<Conversation[]>(`/customers/${customerId}/conversations`),
};

// Chat message type definition
export type ChatMessage = {
  role: 'assistant' | 'user';
  content: string;
};

// Chat endpoints
export const chatApi = {
  sendMessage: async (message: string) => {
    return fetchApi<{ response: string }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
};