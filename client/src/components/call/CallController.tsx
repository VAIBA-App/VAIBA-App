import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneCall, PhoneOff, Mic, Play } from "lucide-react";
import { elevenLabsService } from "@/lib/elevenlabs";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CallController() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [transcribedText, setTranscribedText] = useState("");
  const { toast } = useToast();

  const introText = "Hallo, hier ist VAIBA, Ihr virtueller Verkaufsassistent. Wie kann ich Ihnen heute helfen?";

  const handleStartCall = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine Telefonnummer ein.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setIsCallActive(true);

      window.location.href = `tel:${phoneNumber.replace(/\s/g, '')}`;

      toast({
        title: "Anruf wird vorbereitet",
        description: "Die Telefon-App wird mit der eingegebenen Nummer geöffnet.",
      });
    } catch (error) {
      console.error("Error preparing call:", error);
      toast({
        title: "Fehler bei der Vorbereitung",
        description: "Die Anrufvorbereitung konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
      setIsCallActive(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlayIntro = async () => {
    try {
      setIsProcessing(true);
      await elevenLabsService.speakText(introText);
      toast({
        title: "Einleitung gestartet",
        description: "Die Begrüßung wird über Ihr Headset ausgegeben.",
      });
    } catch (error) {
      console.error("Error playing intro:", error);
      toast({
        title: "Fehler",
        description: "Die Einleitung konnte nicht abgespielt werden.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setIsRecording(false);
    setTranscribedText("");
    toast({
      title: "Anruf beenden",
      description: "Bitte beenden Sie den Anruf auf Ihrem Smartphone.",
    });
  };

  return (
    <div className="space-y-6 w-full max-w-4xl">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>VAIBA Anrufsteuerung</span>
            {isCallActive && (
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-sm font-normal">Aktiver Anruf</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm">
            <h3 className="font-medium mb-2">So funktioniert's:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Geben Sie hier die gewünschte Telefonnummer ein</li>
              <li>Nach Klick auf "Anruf starten" öffnet sich Ihre Telefon-App mit der Nummer</li>
              <li>Sobald Ihr Gesprächspartner den Anruf angenommen hat, spielen Sie die VAIBA-Einleitung ab</li>
            </ol>
          </div>

          <div className="flex gap-4">
            <Input
              type="tel"
              placeholder="Telefonnummer eingeben..."
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isCallActive || isProcessing}
              className="flex-1"
            />
            {!isCallActive ? (
              <Button
                onClick={handleStartCall}
                className="bg-green-500 hover:bg-green-600"
                disabled={isProcessing || !phoneNumber.trim()}
              >
                <PhoneCall className="mr-2 h-4 w-4" />
                {isProcessing ? "Wird vorbereitet..." : "Anruf starten"}
              </Button>
            ) : (
              <Button
                onClick={handleEndCall}
                variant="destructive"
                disabled={isProcessing}
              >
                <PhoneOff className="mr-2 h-4 w-4" />
                Anruf beenden
              </Button>
            )}
          </div>

          {isCallActive && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Vorgespeicherte Einleitung:</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePlayIntro}
                  disabled={isProcessing}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Einleitung abspielen
                </Button>
              </div>
              <Textarea
                value={introText}
                readOnly
                className="h-20 bg-muted"
              />
            </div>
          )}

          {isCallActive && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Gesprächsverlauf:</label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mic className="h-4 w-4" />
                  <span>Warte auf Gesprächspartner...</span>
                </div>
              </div>
              <Textarea
                value={transcribedText}
                readOnly
                className="h-32 bg-muted"
                placeholder="Hier erscheint der transkribierte Text des Gesprächs..."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}