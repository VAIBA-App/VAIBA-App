import { useState, useEffect } from 'react';

export interface Conversation {
  id: string;
  customerName: string;
  timestamp: Date;
  dialog: {
    customerText: string;
    gptResponse: string;
  }[];
}

const STORAGE_KEY = 'vaiba-conversations';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((conv: any) => ({
          ...conv,
          timestamp: new Date(conv.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
    return [];
  });

  const addConversation = (conversation: Omit<Conversation, 'id' | 'timestamp'>) => {
    const newConversation: Conversation = {
      ...conversation,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    setConversations(prev => {
      const updated = [newConversation, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving conversations:', error);
      }
      return updated;
    });
  };

  return {
    conversations,
    addConversation,
  };
}
