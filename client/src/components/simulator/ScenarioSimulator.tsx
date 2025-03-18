import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { scenarios, type Scenario, scenarioSchema } from "@/lib/scenarios";
import { elevenLabsService } from "@/lib/elevenlabs";
import { useToast } from "@/hooks/use-toast";
import { Play, Phone, Trash2, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { openai } from "@/lib/openai";
import DOMPurify from 'dompurify';

function createMarkup(html: string) {
  return {
    __html: DOMPurify.sanitize(html)
  };
}

export function ScenarioSimulator() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(scenarios[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      prompt: "",
    },
  });

  const playScenarioIntro = async () => {
    try {
      setIsPlaying(true);

      toast({
        title: "Simulation wird gestartet",
        description: "Bitte warten Sie, während die Sprachausgabe vorbereitet wird...",
      });

      await elevenLabsService.speakText(selectedScenario.script.intro);

      toast({
        title: "Szenario gestartet",
        description: "Die Simulation wurde erfolgreich gestartet.",
      });
    } catch (error) {
      console.error("Error playing scenario:", error);

      toast({
        title: "Fehler beim Starten der Simulation",
        description: "Die Sprachausgabe konnte nicht initialisiert werden. Sie können trotzdem das Szenario durchgehen und die Skripte lesen.",
        variant: "destructive",
      });
    } finally {
      setIsPlaying(false);
    }
  };

  const handleDeleteScenario = (scenarioId: string) => {
    if (scenarios.length <= 1) {
      toast({
        title: "Löschen nicht möglich",
        description: "Es muss mindestens ein Szenario verfügbar sein.",
        variant: "destructive",
      });
      return;
    }

    const index = scenarios.findIndex(s => s.id === scenarioId);
    if (index !== -1) {
      scenarios.splice(index, 1);
      setSelectedScenario(scenarios[0]);
      toast({
        title: "Szenario gelöscht",
        description: "Das Szenario wurde erfolgreich gelöscht.",
      });
    }
  };

  const generateScenario = async (prompt: string) => {
    try {
      setIsGenerating(true);
      toast({
        title: "Szenario wird generiert",
        description: "Bitte warten Sie einen Moment...",
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "Du bist ein Experte für Verkaufsszenarien. Erstelle ein detailliertes Verkaufsszenario basierend auf der Eingabe des Benutzers. " +
              "Das Szenario sollte ein Kundenprofil, ein Skript, Kernpunkte, mögliche Einwände und empfohlene Antworten enthalten. " +
              "Generiere eine eindeutige ID und einen passenden Titel. " +
              "Formatiere die Ausgabe als JSON mit dieser Struktur: " +
              JSON.stringify({
                id: "string (eindeutige ID)",
                title: "string (kurzer, beschreibender Titel)",
                description: "string (kurze Beschreibung des Szenarios)",
                customerProfile: {
                  name: "string (Name des Kunden)",
                  role: "string (Position/Rolle)",
                  industry: "string (Branche)",
                  pain_points: ["string (Liste der Problempunkte)"]
                },
                script: {
                  intro: "string (Einleitungstext)",
                  key_points: ["string (Liste der Kernpunkte)"],
                  potential_objections: ["string (Liste möglicher Einwände)"],
                  recommended_responses: ["string (Liste empfohlener Antworten)"]
                }
              })
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Keine Antwort vom KI-Modell erhalten");
      }

      const newScenario = JSON.parse(content);
      const result = scenarioSchema.safeParse(newScenario);

      if (!result.success) {
        console.error("Validation errors:", result.error);
        throw new Error("Das generierte Szenario entspricht nicht dem erwarteten Format");
      }

      scenarios.push(result.data);
      setSelectedScenario(result.data);

      toast({
        title: "Szenario erstellt",
        description: "Ein neues Szenario wurde erfolgreich generiert.",
      });

      form.reset();
    } catch (error) {
      console.error("Error generating scenario:", error);

      // Handle specific error types
      let errorMessage = "Ein unerwarteter Fehler ist aufgetreten.";

      if (error.response?.status === 429) {
        errorMessage = "Das API-Limit wurde erreicht. Bitte versuchen Sie es später erneut.";
      } else if (error.response?.status === 401) {
        errorMessage = "API-Authentifizierungsfehler. Bitte überprüfen Sie Ihre API-Schlüssel.";
      } else if (error.response?.status >= 500) {
        errorMessage = "OpenAI-Serverfehler. Bitte versuchen Sie es später erneut.";
      } else if (error instanceof SyntaxError) {
        errorMessage = "Fehler beim Verarbeiten der KI-Antwort. Bitte versuchen Sie es mit einer kürzeren oder präziseren Beschreibung.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Fehler bei der Szenario-Generierung",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Scenario Carousel */}
      <div className="w-full relative">
        <Carousel className="w-full">
          <CarouselContent>
            {scenarios.map((scenario, index) => (
              <CarouselItem key={scenario.id}>
                <Card
                  className={`cursor-pointer transition-all ${
                    selectedScenario.id === scenario.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedScenario(scenario)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{scenario.title}</h3>
                    <p className="text-sm text-muted-foreground">{scenario.description}</p>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      {/* Main Scenario Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            {selectedScenario.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            {selectedScenario.description}
          </p>

          <Tabs defaultValue="profile" className="mt-4">
            <TabsList>
              <TabsTrigger value="profile">Kundenprofil</TabsTrigger>
              <TabsTrigger value="script">Gesprächsleitfaden</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Kundeninformationen</h3>
                <div className="grid gap-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {selectedScenario.customerProfile.name}
                  </div>
                  <div>
                    <span className="font-medium">Position:</span> {selectedScenario.customerProfile.role}
                  </div>
                  <div>
                    <span className="font-medium">Branche:</span> {selectedScenario.customerProfile.industry}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Schmerzpunkte</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {selectedScenario.customerProfile.pain_points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="script" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Einleitung</h3>
                <p className="text-sm">{selectedScenario.script.intro}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Kernpunkte</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {selectedScenario.script.key_points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Mögliche Einwände</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {selectedScenario.script.potential_objections.map((objection, index) => (
                    <li key={index}>{objection}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Empfohlene Antworten</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {selectedScenario.script.recommended_responses.map((response, index) => (
                    <li key={index}>{response}</li>
                  ))}
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end gap-4">
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() => handleDeleteScenario(selectedScenario.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Szenario löschen
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={playScenarioIntro}
              disabled={isPlaying}
            >
              <Play className="mr-2 h-4 w-4" />
              {isPlaying ? "Wird abgespielt..." : "Simulation starten"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Neues Szenario generieren
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => generateScenario(data.prompt))} className="space-y-4">
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschreiben Sie das gewünschte Verkaufsszenario</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="z.B.: Erstelle ein Verkaufsszenario für ein Premium-CRM-System an einen mittelständischen Produktionsbetrieb..."
                        className="min-h-[100px]"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? "Wird generiert..." : "Szenario generieren"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}