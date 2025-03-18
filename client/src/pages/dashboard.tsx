import { useState, useEffect } from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { NetworkStatus } from "@/components/dashboard/network-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, RefreshCw, BarChart2, Megaphone, User, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { chatApi } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DOMPurify from 'dompurify';

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

function createMarkup(html: string) {
  return {
    __html: DOMPurify.sanitize(html)
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');

  // Fetch assistant profile with improved configuration
  const { data: activeProfile } = useQuery({
    queryKey: ['/api/profiles'],
    queryFn: async () => {
      const response = await fetch('/api/profiles');
      if (!response.ok) {
        throw new Error('Failed to fetch profiles');
      }
      const profiles = await response.json();
      return Array.isArray(profiles) ? profiles.find((p: any) => p.isActive) : null;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  useEffect(() => {
    // Update initial greeting when activeProfile changes
    const getInitialGreeting = () => {
      const assistantName = activeProfile ? `${activeProfile.name}${activeProfile.lastName ? ` ${activeProfile.lastName}` : ''}` : "VAIBA";
      return {
        role: 'assistant' as const,
        content: `Hallo! Ich bin ${assistantName}. Ich bin Ihr persönlicher VAIBA Assistent. Wie kann ich Ihnen heute helfen?`
      };
    };

    if (activeProfile) {
      setMessages([getInitialGreeting()]);
    }
  }, [activeProfile]);

  const quickCommands = [
    { icon: <RefreshCw className="w-4 h-4" />, label: "Update abrufen" },
    { icon: <BarChart2 className="w-4 h-4" />, label: "Tagesbericht" },
    { icon: <Megaphone className="w-4 h-4" />, label: "Marketing" },
  ];

  const sendMessageMutation = useMutation({
    mutationFn: chatApi.sendMessage,
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Entschuldigung, es gab einen Fehler bei der Verarbeitung Ihrer Nachricht.",
        variant: "destructive",
      });
      console.error('Chat error:', error);
    }
  });

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      await sendMessageMutation.mutateAsync(input);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          {/* AI Assistant Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                AI Business Assistent
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-2">
              <Avatar className="w-24 h-24">
                <AvatarImage 
                  src={activeProfile?.imageUrl || "/default-avatar.png"} 
                  alt={activeProfile?.name || "VAIBA"} 
                />
                <AvatarFallback>
                  <User className="w-12 h-12 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="font-semibold text-lg">
                  {activeProfile ? `${activeProfile.name}${activeProfile.lastName ? ` ${activeProfile.lastName}` : ''}` : "VAIBA"}
                </h3>
              </div>
            </CardContent>
          </Card>

          {/* Chat Card */}
          <Card className="h-[500px] mb-8">
            <CardHeader>
              <CardTitle>
                Assistent {activeProfile ? `${activeProfile.name}${activeProfile.lastName ? ` ${activeProfile.lastName}` : ''}` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-4rem)] flex flex-col">
              <ScrollArea className="flex-1 pr-4 mb-4">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === 'assistant' ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      <div
                        className={`rounded-lg px-4 py-2 max-w-[80%] ${
                          message.role === 'assistant'
                            ? 'bg-secondary'
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          <div 
                            dangerouslySetInnerHTML={createMarkup(message.content)}
                            className="prose prose-sm dark:prose-invert max-w-none"
                          />
                        ) : (
                          message.content
                        )}
                      </div>
                    </div>
                  ))}
                  {sendMessageMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="rounded-lg px-4 py-2 bg-secondary">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="border-t pt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Schreiben Sie eine Nachricht..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <Button 
                    onClick={handleSend}
                    disabled={sendMessageMutation.isPending}
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Commands Card */}
          <Card>
            <CardHeader>
              <CardTitle>Schnellbefehle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {quickCommands.map((command, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setInput(command.label)}
                  >
                    {command.icon}
                    <span className="ml-2">{command.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <div className="grid gap-8">
            <StatsCards stats={stats} />
            <NetworkStatus />
          </div>

          <Card className="p-6 mt-8">
            <h2 className="text-2xl font-semibold mb-4">Call Volume Trend</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="calls" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const stats = {
  totalCalls: 157,
  positiveRate: 0.68,
  averageDuration: 420,
  callsByStatus: {
    positive: 107,
    negative: 20,
    neutral: 30,
    active: 5
  }
};

const chartData = [
  { date: '2024-01', calls: 65 },
  { date: '2024-02', calls: 75 },
  { date: '2024-03', calls: 85 },
];