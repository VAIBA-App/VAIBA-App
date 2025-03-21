import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/hooks/use-auth";

export default function WebsiteGenerator() {
  const [designDescription, setDesignDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [savedDesign, setSavedDesign] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Lade gespeicherte Beschreibung beim Start
  useEffect(() => {
    const loadSavedDesign = async () => {
      try {
        const response = await axios.get('/api/website-designs/latest');
        if (response.data) {
          setDesignDescription(response.data.designDescription || "");
          setSavedDesign(response.data.designDescription || "");
          setPreviewUrl(response.data.previewUrl || "");
        }
      } catch (error) {
        console.error("Fehler beim Laden des gespeicherten Designs:", error);
      }
    };

    loadSavedDesign();
  }, []);

  const handleSubmit = async () => {
    if (!designDescription.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine Designbeschreibung ein.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // 1. Anfrage an den Server, um den OpenAI Call zu machen
      const response = await axios.post('/api/website-designs/generate', {
        designDescription
      });

      if (response.data && response.data.previewUrl) {
        setPreviewUrl(response.data.previewUrl);
        setSavedDesign(designDescription);
        
        toast({
          title: "Erfolg!",
          description: "Ihre Website wurde erstellt und kann nun angezeigt werden."
        });
      } else {
        throw new Error("Keine Vorschau-URL erhalten");
      }
    } catch (error) {
      console.error("Fehler bei der Website-Generierung:", error);
      toast({
        title: "Fehler",
        description: "Bei der Generierung Ihrer Website ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = designDescription !== savedDesign;

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold">Website/Shop erstellen</h1>

      {previewUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Vorschau Live-Website</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full aspect-video border rounded-lg overflow-hidden">
              <iframe 
                src={previewUrl} 
                className="w-full h-full"
                title="Website Vorschau"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Design</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Beschreiben Sie Ihr Design so detailliert wie möglich z.B. Informationen über Ihre Branche/Tätigkeit, 
              Onlineshop oder Website, Farben & Design (futuristisch, klassisch, modern, etc.), 
              Kontaktformular, Blog, Terminbuchung, ...
            </AlertDescription>
          </Alert>
          
          <Textarea
            placeholder="Beschreiben Sie hier Ihr gewünschtes Website-Design..."
            className="min-h-[200px]"
            value={designDescription}
            onChange={(e) => setDesignDescription(e.target.value)}
          />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleSubmit}
            disabled={isLoading || !hasChanges} 
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Erstelle Website...
              </>
            ) : (
              hasChanges ? "Erstellen" : "Keine Änderungen"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}