import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { analyzeSentiment } from "@/lib/openai";

interface LiveDialogProps {
  customerText: string;
  gptResponse: string;
  assistantName: string;
  customerName: string;  // Added customerName prop
}

type Mood = "😄" | "🙂" | "😐" | "🙁" | "😠" | "🤔";

export function LiveDialog({ customerText, gptResponse, assistantName, customerName }: LiveDialogProps) {
  const [mood, setMood] = useState<Mood>("😐");

  useEffect(() => {
    const analyzeMood = async () => {
      if (!customerText) return;

      try {
        const sentiment = await analyzeSentiment(customerText);

        // Map sentiment rating to mood emoji
        const moodMap: { [key: number]: Mood } = {
          1: "😠", // Very negative
          2: "🙁", // Negative
          3: "😐", // Neutral
          4: "🙂", // Positive
          5: "😄"  // Very positive
        };

        setMood(moodMap[sentiment.rating] || "🤔");
      } catch (error) {
        console.error("Error analyzing mood:", error);
        setMood("😐");
      }
    };

    analyzeMood();
  }, [customerText]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Customer Speech Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{customerName}</CardTitle>
          <Badge variant="outline" className="text-xl">
            {mood}
          </Badge>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            <p className="text-sm">{customerText || "Warte auf Spracheingabe..."}</p>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Assistant Response Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{assistantName}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            <p className="text-sm whitespace-pre-wrap">
              {gptResponse || `Warte auf Antwort von ${assistantName}...`}
            </p>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}