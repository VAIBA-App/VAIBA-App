import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Mic } from "lucide-react";
import { Link } from "wouter";

export default function InstantVoiceCloning() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
    }
  };

  const handleUpload = async () => {
    if (!audioFile) return;

    setIsProcessing(true);
    try {
      // TODO: Implement ElevenLabs API integration
      toast({
        title: "Erfolg",
        description: "Audio-Sample wurde erfolgreich hochgeladen.",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Fehler beim Upload",
        description: "Das Audio-Sample konnte nicht verarbeitet werden.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold mb-8">Instant Voice Cloning</h1>
        <Link href="/voice/pvc">
          <Button variant="outline">
            Zu Professional Voice Cloning wechseln
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audio-Sample hochladen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="flex-1"
            />
            <Button
              onClick={handleUpload}
              disabled={!audioFile || isProcessing}
            >
              {isProcessing ? (
                "Verarbeite..."
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Hochladen
                </>
              )}
            </Button>
          </div>

          <div className="rounded-lg border p-4 mt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mic className="h-4 w-4" />
              <p className="text-sm">
                Laden Sie eine kurze Audioaufnahme (mindestens 30 Sekunden) hoch,
                um eine schnelle Stimmklonung durchzuführen.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}