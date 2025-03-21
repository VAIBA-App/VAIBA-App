import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Globe, Code2, Eye, RefreshCw, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface WebsiteDesign {
  id: number;
  userId: number | null;
  designDescription: string;
  generatedCode: string | null;
  previewUrl: string | null;
  created_at: string;
  updated_at: string;
}

export default function WebsiteGenerator() {
  const [description, setDescription] = useState<string>("");
  const [selectedDesign, setSelectedDesign] = useState<WebsiteDesign | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's website designs
  const { data: designs = [], isLoading: isLoadingDesigns } = useQuery({
    queryKey: ["/api/website-designs"],
    queryFn: () => apiRequest<WebsiteDesign[]>("GET", "/api/website-designs"),
  });

  // Set the latest design as selected, if any
  useEffect(() => {
    if (designs.length > 0) {
      const sortedDesigns = [...designs].sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      setSelectedDesign(sortedDesigns[0]);
      setDescription(sortedDesigns[0].designDescription || "");
    }
  }, [designs]);

  // Create a new design
  const createDesignMutation = useMutation({
    mutationFn: (designData: { designDescription: string; userId?: number }) => 
      apiRequest("POST", "/api/website-designs", designData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/website-designs"] });
      toast({
        title: "Website erstellt",
        description: "Ihre Website-Design wurde erfolgreich generiert.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Erstellen der Website: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update an existing design
  const updateDesignMutation = useMutation({
    mutationFn: (data: { id: number; designDescription: string }) => 
      apiRequest("PUT", `/api/website-designs/${data.id}`, { designDescription: data.designDescription }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/website-designs"] });
      toast({
        title: "Website aktualisiert",
        description: "Ihre Website-Design wurde erfolgreich aktualisiert.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Aktualisieren der Website: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleCreateOrUpdate = useCallback(() => {
    if (!description.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine Design-Beschreibung ein.",
        variant: "destructive",
      });
      return;
    }

    if (selectedDesign) {
      updateDesignMutation.mutate({
        id: selectedDesign.id,
        designDescription: description
      });
    } else {
      createDesignMutation.mutate({
        designDescription: description,
        userId: 1, // Placeholder, sollte vom auth Kontext kommen
      });
    }
  }, [selectedDesign, description, createDesignMutation, updateDesignMutation, toast]);

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Website/Shop erstellen</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Design beschreiben</CardTitle>
            <CardDescription>
              Beschreiben Sie, wie Ihre Website oder Ihr Online-Shop aussehen soll. Je detaillierter, desto besser.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="Beschreiben Sie Ihre ideale Website... (z.B. 'Ich möchte eine moderne Website für mein Café mit einem Reservierungssystem, einer Speisekarte und Fotos meines Cafés.')" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              className="h-80"
            />
            <div className="mt-2 text-sm text-muted-foreground">
              Tipp: Erwähnen Sie Farbschema, Struktur, Funktionen und Inhalte, die Sie auf Ihrer Website haben möchten.
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              disabled={isLoadingDesigns || createDesignMutation.isPending || updateDesignMutation.isPending}
              onClick={() => {
                if (selectedDesign) {
                  setDescription(selectedDesign.designDescription || "");
                } else {
                  setDescription("");
                }
              }}
            >
              Zurücksetzen
            </Button>
            <Button 
              onClick={handleCreateOrUpdate}
              disabled={isLoadingDesigns || createDesignMutation.isPending || updateDesignMutation.isPending}
            >
              {(createDesignMutation.isPending || updateDesignMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generiere...
                </>
              ) : selectedDesign ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Aktualisieren
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Erstellen
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <div className="md:col-span-1 space-y-6">
          <Alert className="bg-muted">
            <Globe className="h-4 w-4" />
            <AlertTitle>So funktioniert es</AlertTitle>
            <AlertDescription>
              <ol className="list-decimal list-inside space-y-2 mt-2">
                <li>Beschreiben Sie Ihre Wunsch-Website so detailliert wie möglich</li>
                <li>Klicken Sie auf "Erstellen", um den KI-Generierungsprozess zu starten</li>
                <li>Die KI analysiert Ihre Beschreibung und erstellt ein maßgeschneidertes Design</li>
                <li>Sehen Sie sich die Vorschau an und passen Sie bei Bedarf Ihre Beschreibung an</li>
              </ol>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Website Vorschau</CardTitle>
              <CardDescription>
                {selectedDesign ? 
                  `Zuletzt aktualisiert: ${new Date(selectedDesign.updated_at).toLocaleString('de-DE')}` : 
                  "Noch keine Website generiert"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingDesigns ? (
                <div className="flex flex-col items-center justify-center h-80">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p>Lade Vorschau...</p>
                </div>
              ) : selectedDesign && selectedDesign.generatedCode ? (
                <Tabs defaultValue="preview">
                  <TabsList className="w-full">
                    <TabsTrigger value="preview" className="flex-1"><Eye className="mr-2 h-4 w-4" /> Vorschau</TabsTrigger>
                    <TabsTrigger value="code" className="flex-1"><Code2 className="mr-2 h-4 w-4" /> Code</TabsTrigger>
                  </TabsList>
                  <TabsContent value="preview" className="border rounded-b-md">
                    <div className="h-80 overflow-hidden border rounded">
                      <iframe 
                        srcDoc={selectedDesign.generatedCode}
                        title="Website Preview"
                        className="w-full h-full"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="code">
                    <div className="h-80 overflow-auto p-4 bg-muted rounded-b-md">
                      <pre className="text-xs">{selectedDesign.generatedCode}</pre>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex flex-col items-center justify-center h-80 p-4 text-center">
                  <Globe className="h-16 w-16 mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Beschreiben Sie Ihre Website und klicken Sie auf "Erstellen", um eine Vorschau zu generieren.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {designs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Ihre gespeicherten Designs</h2>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {designs.map((design) => (
              <Card 
                key={design.id}
                className={`cursor-pointer ${selectedDesign?.id === design.id ? 'border-primary' : ''}`}
                onClick={() => {
                  setSelectedDesign(design);
                  setDescription(design.designDescription || "");
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base truncate">
                    {design.designDescription.length > 40 
                      ? design.designDescription.substring(0, 40) + "..." 
                      : design.designDescription}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {new Date(design.created_at).toLocaleDateString('de-DE')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-24 overflow-hidden">
                  {design.generatedCode ? (
                    <iframe 
                      srcDoc={design.generatedCode}
                      title={`Design ${design.id}`}
                      className="w-full h-full"
                      sandbox="allow-same-origin"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">Keine Vorschau verfügbar</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}