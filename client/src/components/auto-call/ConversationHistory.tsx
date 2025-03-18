import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Clock, MessageSquare } from "lucide-react";
import { Loader2 } from "lucide-react";
import DOMPurify from 'dompurify';

interface Conversation {
  id: string;
  customerName: string;
  timestamp: Date;
  dialog: {
    customerText: string;
    gptResponse: string;
  }[];
}

interface ConversationHistoryProps {
  conversations: Conversation[];
  isLoading: boolean;
  activeProfile?: { name: string }; // Added activeProfile type
}

function createMarkup(html: string) {
  return {
    __html: DOMPurify.sanitize(html)
  };
}

export function ConversationHistory({ conversations, isLoading, activeProfile }: ConversationHistoryProps) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Gesprächsverlauf
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Gesprächsverlauf
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {conversations.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Noch keine Gespräche vorhanden
              </p>
            ) : (
              <div className="grid gap-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div>
                      <h3 className="font-medium">{conversation.customerName}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {conversation.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Anzeigen
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Gespräch mit {selectedConversation?.customerName}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            {selectedConversation?.dialog.map((entry, index) => (
              <div key={index} className="mb-6">
                <div className="bg-muted p-4 rounded-lg mb-2">
                  <h4 className="font-medium mb-2">{selectedConversation?.customerName}:</h4>
                  <p className="text-sm">{entry.customerText}</p>
                </div>
                <div className="bg-primary/5 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">{activeProfile?.name || "Assistent"}:</h4>
                  <div 
                    className="text-sm prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={createMarkup(entry.gptResponse)}
                  />
                </div>
              </div>
            ))}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}