import { useState, useCallback, useEffect, useRef, ChangeEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { 
  Loader2, Globe, Code2, Eye, RefreshCw, Save, 
  Trash2, ExternalLink, AlertTriangle, ImageIcon,
  UploadCloud
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { websiteDesignApi } from "@/lib/api";
import { PencilRuler } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [designToDelete, setDesignToDelete] = useState<WebsiteDesign | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [editedCode, setEditedCode] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedImage, setUploadedImage] = useState<{url: string, originalName: string} | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's website designs
  const { data: designs = [], isLoading: isLoadingDesigns } = useQuery({
    queryKey: ["/api/website-designs"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/website-designs");
      return response as unknown as WebsiteDesign[];
    },
  });

  // Set the latest design as selected, if any
  useEffect(() => {
    if (designs.length > 0) {
      const sortedDesigns = [...designs].sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      
      // Bereinigen der Backticks aus dem generierten Code
      const cleanedDesign = {
        ...sortedDesigns[0],
        generatedCode: sortedDesigns[0].generatedCode?.replace(/```html|```/g, '') || ""
      };
      
      setSelectedDesign(cleanedDesign);
      setDescription(cleanedDesign.designDescription || "");
      console.log("Initial design set:", cleanedDesign);
    }
  }, [designs]);

  // Create a new design
  const createDesignMutation = useMutation({
    mutationFn: async (designData: { designDescription: string; userId?: number }) => {
      try {
        console.log("Mutation started with data:", designData);
        const response = await apiRequest("POST", "/api/website-designs", designData);
        console.log("API response for create:", response);
        return response;
      } catch (error) {
        console.error("Mutation failed:", error);
        throw error;
      }
    },
    onSuccess: (data: WebsiteDesign) => {
      // Manuell das neue Design direkt setzen
      const cleanedData = {
        ...data,
        generatedCode: data.generatedCode?.replace(/```html|```/g, '') || ""
      };
      console.log("Design erstellt:", cleanedData);
      
      // Wichtig: Setze das Design direkt, bevor die Liste aktualisiert wird
      setSelectedDesign(cleanedData);
      
      // Dann erst die Query-Liste aktualisieren
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
    mutationFn: async (data: { id: number; designDescription: string }) => {
      const response = await apiRequest("PUT", `/api/website-designs/${data.id}`, { 
        designDescription: data.designDescription 
      });
      return response as unknown as WebsiteDesign;
    },
    onSuccess: (data: WebsiteDesign) => {
      // Auch beim Update das neue Design direkt setzen
      const cleanedData = {
        ...data,
        generatedCode: data.generatedCode?.replace(/```html|```/g, '') || ""
      };
      console.log("Design aktualisiert:", cleanedData);
      
      // Wichtig: Setze das Design direkt, bevor die Liste aktualisiert wird
      setSelectedDesign(cleanedData);
      
      // Dann erst die Query-Liste aktualisieren
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

  // Delete a design
  const deleteDesignMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/website-designs/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Website gelöscht",
        description: "Website-Design wurde erfolgreich gelöscht.",
      });
      
      // Nach dem Löschen das Query neu laden
      queryClient.invalidateQueries({ queryKey: ["/api/website-designs"] });
      
      // Wenn das aktuell ausgewählte Design gelöscht wurde, setzen wir es zurück
      if (selectedDesign && designToDelete && selectedDesign.id === designToDelete.id) {
        setSelectedDesign(null);
        setDescription("");
      }
      
      // Dialog schließen und Status zurücksetzen
      setShowConfirmDelete(false);
      setDesignToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Löschen des Website-Designs: ${error.message}`,
        variant: "destructive",
      });
      setShowConfirmDelete(false);
    }
  });

  // Öffnet ein neues Fenster mit der vollständigen Website-Vorschau
  const openInNewTab = useCallback(() => {
    if (!selectedDesign?.generatedCode) return;
    
    // Erstellt einen Blob mit dem HTML-Inhalt
    const blob = new Blob([selectedDesign.generatedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Öffnet ein neues Fenster mit dem Inhalt
    window.open(url, '_blank');
    
    // Bereinigt die URL nach dem Öffnen des Fensters
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [selectedDesign]);

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
      <h1 className="text-3xl font-bold mb-6"><PencilRuler />Website erstellen </h1>       
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Website Vorschau</CardTitle>
                  <CardDescription>
                    {selectedDesign ? 
                      `Zuletzt aktualisiert: ${new Date(selectedDesign.updated_at).toLocaleString('de-DE')}` : 
                      "Noch keine Website generiert"
                    }
                  </CardDescription>
                </div>
                {selectedDesign && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={(e) => {
                        e.stopPropagation();
                        openInNewTab();
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" /> Im Browser öffnen
                    </Button>
                  </div>
                )}
              </div>
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
                    <TabsTrigger value="images" className="flex-1"><ImageIcon className="mr-2 h-4 w-4" /> Bilder</TabsTrigger>
                  </TabsList>
                  <TabsContent value="preview" className="border rounded-b-md">
                    <div className="h-80 overflow-hidden border rounded bg-white">
                      <iframe 
                        srcDoc={selectedDesign?.generatedCode?.replace(/```html|```/g, '') || ""}
                        title="Website Preview"
                        className="w-full h-full transform scale-100 origin-top-left"
                        sandbox="allow-same-origin allow-scripts allow-forms"
                        loading="eager"
                        onLoad={(e) => console.log("iframe loaded successfully")}
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="code">
                    <div className="h-80 bg-muted rounded-b-md flex flex-col">
                      <div className="flex items-center justify-between p-2 border-b">
                        <div className="text-sm text-muted-foreground">HTML-Editor</div>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            if (selectedDesign && editedCode) {
                              websiteDesignApi.updateCode(selectedDesign.id, editedCode)
                                .then((updatedDesign) => {
                                  setSelectedDesign(updatedDesign);
                                  toast({
                                    title: "Code aktualisiert",
                                    description: "Der HTML-Code wurde erfolgreich aktualisiert."
                                  });
                                })
                                .catch(error => {
                                  toast({
                                    title: "Fehler",
                                    description: `Fehler beim Aktualisieren des Codes: ${error.message}`,
                                    variant: "destructive"
                                  });
                                });
                            }
                          }}
                          disabled={!editedCode || editedCode === selectedDesign.generatedCode}
                        >
                          <Save className="mr-2 h-4 w-4" /> Änderungen speichern
                        </Button>
                      </div>
                      <Textarea 
                        className="flex-1 font-mono text-xs p-4 bg-background"
                        value={editedCode || selectedDesign.generatedCode}
                        onChange={(e) => setEditedCode(e.target.value)}
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="images">
                    <div className="h-80 bg-muted rounded-b-md flex flex-col">
                      <div className="flex items-center justify-between p-2 border-b">
                        <div className="text-sm text-muted-foreground">Bilder hochladen</div>
                      </div>
                      <div className="flex-1 p-4 flex flex-col">
                        <div className="border-2 border-dashed rounded-md border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer h-40 flex flex-col items-center justify-center mb-4"
                          onClick={() => fileInputRef.current?.click()}>
                          <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/jpeg,image/png,image/gif,image/svg+xml"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setIsUploading(true);
                                setUploadedImage(null);
                                
                                websiteDesignApi.uploadImage(file)
                                  .then(response => {
                                    console.log('Image uploaded:', response);
                                    setUploadedImage({
                                      url: response.image.url,
                                      originalName: response.image.originalName
                                    });
                                    
                                    // Text im Code suchen und kopieren
                                    if (selectedDesign && editedCode) {
                                      const imageUrl = response.image.url;
                                      // HTML-Textarea öffnen und Text einfügen
                                      navigator.clipboard.writeText(imageUrl);
                                      toast({
                                        title: "Bild-URL kopiert",
                                        description: "Die URL des Bildes wurde in die Zwischenablage kopiert."
                                      });
                                    }
                                    
                                    toast({
                                      title: "Bild hochgeladen",
                                      description: "Das Bild wurde erfolgreich hochgeladen."
                                    });
                                  })
                                  .catch(error => {
                                    console.error('Error uploading image:', error);
                                    toast({
                                      title: "Fehler",
                                      description: `Fehler beim Hochladen des Bildes: ${error.message}`,
                                      variant: "destructive"
                                    });
                                  })
                                  .finally(() => {
                                    setIsUploading(false);
                                  });
                              }
                            }}
                          />
                          {isUploading ? (
                            <>
                              <Loader2 className="h-10 w-10 text-muted-foreground mb-2 animate-spin" />
                              <p className="text-sm text-muted-foreground">Bild wird hochgeladen...</p>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">Klicken Sie hier, um ein Bild auszuwählen</p>
                              <p className="text-xs text-muted-foreground mt-1">Unterstützte Formate: JPG, PNG, GIF, SVG</p>
                            </>
                          )}
                        </div>
                        
                        {uploadedImage && (
                          <div className="border rounded-md p-4 mt-auto">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium">Hochgeladenes Bild</h3>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => {
                                  navigator.clipboard.writeText(uploadedImage.url);
                                  toast({
                                    title: "Bild-URL kopiert",
                                    description: "Die URL des Bildes wurde in die Zwischenablage kopiert."
                                  });
                                }}
                              >
                                URL kopieren
                              </Button>
                            </div>
                            <div className="flex gap-4 items-center">
                              <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                                <img src={uploadedImage.url} alt="Vorschau" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium truncate">{uploadedImage.originalName}</p>
                                <p className="text-xs text-muted-foreground break-all">{uploadedImage.url}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
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
                  // Auch beim Auswählen sollten wir die Backticks entfernen
                  const cleanedDesign = {
                    ...design,
                    generatedCode: design.generatedCode?.replace(/```html|```/g, '') || ""
                  };
                  setSelectedDesign(cleanedDesign);
                  setDescription(design.designDescription || "");
                  console.log("Design ausgewählt:", cleanedDesign);
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base truncate">
                        {design.designDescription.length > 40 
                          ? design.designDescription.substring(0, 40) + "..." 
                          : design.designDescription}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {new Date(design.created_at).toLocaleDateString('de-DE')}
                      </CardDescription>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDesignToDelete(design);
                        setShowConfirmDelete(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="h-24 overflow-hidden">
                  {design.generatedCode ? (
                    <div className="w-full h-full overflow-hidden">
                      <iframe 
                        srcDoc={design.generatedCode?.replace(/```html|```/g, '')}
                        title={`Design ${design.id}`}
                        className="w-full h-full scale-90 origin-top-left"
                        sandbox="allow-same-origin allow-scripts allow-forms"
                      />
                    </div>
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

      {/* Bestätigungsdialog für Löschen */}
      <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Website-Design löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie dieses Website-Design wirklich löschen? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (designToDelete) {
                  deleteDesignMutation.mutate(designToDelete.id);
                }
              }}
            >
              {deleteDesignMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Löschen...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Löschen
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}