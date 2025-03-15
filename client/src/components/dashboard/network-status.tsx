import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Network } from "lucide-react";
import { elevenLabsService } from "@/lib/elevenlabs";
import { openai } from "@/lib/openai";

async function checkOpenAIConnection() {
  try {
    console.log("Testing OpenAI connection...");
    await openai.models.list();
    console.log("OpenAI connection successful");
    return true;
  } catch (error: any) {
    console.error("OpenAI connection test failed:", error);
    if (error?.message && (
      error.message.includes("insufficient_quota") ||
      error.message.includes("exceeded your current quota")
    )) {
      console.log("OpenAI API key is valid but has insufficient quota; treating as successful connection.");
      return true;
    }
    return false;
  }
}

async function checkElevenLabsConnection() {
  try {
    console.log("Testing ElevenLabs connection...");
    const voices = await elevenLabsService.getVoices();
    console.log("ElevenLabs connection successful, number of voices:", voices.length);
    return true;
  } catch (error: any) {
    console.error("ElevenLabs connection test failed:", {
      message: error?.message,
      status: error?.status,
      error
    });
    return false;
  }
}

async function checkGoogleConnection() {
  try {
    console.log("Testing Google Maps API connection...");
    // Use Places API instead of Geocoding API since that's what we primarily use
    const response = await fetch(`/api/places/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchTerm: "test",
        location: "Berlin",
        radius: 1000
      }),
    });

    if (response.ok) {
      console.log("Google API connection successful");
      return true;
    }

    console.error("Google API connection failed:", response.status);
    return false;
  } catch (error) {
    console.error("Google API connection test failed:", error);
    return false;
  }
}

export function NetworkStatus() {
  const { data: openAIStatus = false, isLoading: openAILoading } = useQuery({
    queryKey: ['network-status', 'openai'],
    queryFn: checkOpenAIConnection,
    refetchInterval: 30000,
    retry: 2,
    retryDelay: 1000,
  });

  const { data: elevenLabsStatus = false, isLoading: elevenLabsLoading } = useQuery({
    queryKey: ['network-status', 'elevenlabs'],
    queryFn: checkElevenLabsConnection,
    refetchInterval: 30000,
    retry: 2,
    retryDelay: 1000,
  });

  const { data: googleStatus = false, isLoading: googleLoading } = useQuery({
    queryKey: ['network-status', 'google'],
    queryFn: checkGoogleConnection,
    refetchInterval: 30000,
    retry: 2,
    retryDelay: 1000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Netzwerkstatus
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">OpenAI API</span>
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${
                openAILoading
                  ? "bg-yellow-500"
                  : openAIStatus
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            />
            <span className="text-sm text-muted-foreground">
              {openAILoading
                ? "Prüfe Verbindung..."
                : openAIStatus
                ? "Verbunden"
                : "Nicht verbunden"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-medium">ElevenLabs API</span>
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${
                elevenLabsLoading
                  ? "bg-yellow-500"
                  : elevenLabsStatus
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            />
            <span className="text-sm text-muted-foreground">
              {elevenLabsLoading
                ? "Prüfe Verbindung..."
                : elevenLabsStatus
                ? "Verbunden"
                : "Nicht verbunden"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-medium">Google API</span>
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${
                googleLoading
                  ? "bg-yellow-500"
                  : googleStatus
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            />
            <span className="text-sm text-muted-foreground">
              {googleLoading
                ? "Prüfe Verbindung..."
                : googleStatus
                ? "Verbunden"
                : "Nicht verbunden"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}