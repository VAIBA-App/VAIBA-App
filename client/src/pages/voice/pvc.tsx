import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Mic, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";

export default function ProfessionalVoiceCloning() {
  const [audioFiles, setAudioFiles] = useState<FileList | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setAudioFiles(files);
    }
  };

  const handleUpload = async () => {
    if (!audioFiles || audioFiles.length === 0) return;

    setIsProcessing(true);
    try {
      // TODO: Implement ElevenLabs API integration
      toast({
        title: "Erfolg",
        description: "Audio-Samples wurden erfolgreich hochgeladen.",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Fehler beim Upload",
        description: "Die Audio-Samples konnten nicht verarbeitet werden.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold mb-8">Professional Voice Cloning</h1>
        <Link href="/voice/ivc">
          <Button variant="outline">
            Zu Instant Voice Cloning wechseln
          </Button>
        </Link>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Professional Voice Cloning bietet höchste Qualität durch die Verarbeitung
          mehrerer hochwertiger Audio-Samples.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Audio-Samples hochladen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept="audio/*"
              multiple
              onChange={handleFileChange}
              className="flex-1"
            />
            <Button
              onClick={handleUpload}
              disabled={!audioFiles || audioFiles.length === 0 || isProcessing}
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
                Laden Sie mehrere hochwertige Audioaufnahmen (mindestens 3-5 Minuten
                pro Aufnahme) hoch, um eine professionelle Stimmklonung durchzuführen.
              </p>
            </div>
          </div>

          {audioFiles && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Ausgewählte Dateien:</h4>
              <ul className="space-y-1">
                {Array.from(audioFiles).map((file, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}