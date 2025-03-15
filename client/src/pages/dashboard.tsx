import { StatsCards } from "@/components/dashboard/stats-cards";
import { NetworkStatus } from "@/components/dashboard/network-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, RefreshCw, BarChart2, Megaphone, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

export default function Dashboard() {
  const { user } = useAuth();

  // Statische Beispieldaten für Stats
  const stats = {
    totalCalls: 157,
    positiveRate: 0.68,
    averageDuration: 420, // 7 minutes in seconds
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

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hallo! Ich bin Ihr persönlicher VAIBA Assistent. Wie kann ich Ihnen heute helfen?'
    }
  ]);
  const [input, setInput] = useState('');

  const assistantProfile = {
    name: "VAIBA",
    profile_image: "/default-avatar.png"
  };

  const quickCommands = [
    { icon: <RefreshCw className="w-4 h-4" />, label: "Update abrufen" },
    { icon: <BarChart2 className="w-4 h-4" />, label: "Tagesbericht" },
    { icon: <Megaphone className="w-4 h-4" />, label: "Marketing" },
  ];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: 'Ich verarbeite Ihre Anfrage...'
    };
    setMessages(prev => [...prev, assistantMessage]);
    setInput('');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
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
                  src={assistantProfile.profile_image} 
                  alt={assistantProfile.name} 
                />
                <AvatarFallback>
                  <User className="w-12 h-12 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="font-semibold text-lg">{assistantProfile.name}</h3>
              </div>
            </CardContent>
          </Card>

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
          <Card className="h-[calc(50vh-2rem)]">
            <CardHeader>
              <CardTitle>Chat mit {assistantProfile.name}</CardTitle>
            </CardHeader>
            <CardContent className="h-full flex flex-col">
              <ScrollArea className="flex-1 pr-4">
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
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t pt-4 mt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Schreiben Sie eine Nachricht..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <Button onClick={handleSend}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-8">
        <StatsCards stats={stats} />
        <NetworkStatus />
      </div>

      <Card className="p-6">
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
  );
}