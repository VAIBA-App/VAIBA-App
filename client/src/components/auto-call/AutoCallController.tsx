import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { customerApi } from "@/lib/api";
import { Customer } from "@db/schema";
import { useForm } from "react-hook-form";
import { Phone, UserPlus, Users, PhoneOff } from "lucide-react";
import { elevenLabsService } from "@/lib/elevenlabs";
import { LiveDialog } from "./LiveDialog";
import { ConversationHistory } from "./ConversationHistory";
import { useConversations } from "@/hooks/use-conversations";

export function AutoCallController() {
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  const [isCallActive, setIsCallActive] = useState(false);
  const [customerText, setCustomerText] = useState("");
  const [gptResponse, setGptResponse] = useState("");
  const { toast } = useToast();
  const timerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const currentDialogRef = useRef<{ customerText: string; gptResponse: string; }[]>([]);
  const { conversations, addConversation } = useConversations();

  // Lade aktives Profil
  const { data: activeProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['/api/profile'],
    queryFn: async () => {
      const response = await fetch('/api/profile');
      if (!response.ok) return null;
      return response.json();
    },
  });

  const { data: customers, isLoading } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: customerApi.getAll,
  });

  const form = useForm<Partial<Customer>>({
    defaultValues: {
      firstName: "",
      lastName: "",
      company: "",
      phoneNumber: "",
      email: "",
      address: "",
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: customerApi.create,
    onSuccess: () => {
      form.reset();
      toast({
        title: "Kunde hinzugefügt",
        description: "Der neue Kunde wurde erfolgreich gespeichert.",
      });
    },
  });

  const handleEndCall = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Save conversation using the hook
    if (currentDialogRef.current.length > 0 && selectedCustomers[0]) {
      addConversation({
        customerName: `${selectedCustomers[0].firstName} ${selectedCustomers[0].lastName}`.trim(),
        dialog: [...currentDialogRef.current],
      });
    }

    setIsCallActive(false);
    setCustomerText("");
    setGptResponse("");
    currentDialogRef.current = [];

    toast({
      title: "Anruf beendet",
      description: "Der Anruf wurde manuell beendet und gespeichert.",
    });
  };

  const startAutoCalls = async () => {
    if (!activeProfile) {
      toast({
        title: "Kein aktives Profil",
        description: "Bitte aktivieren Sie zuerst ein Profil, bevor Sie einen Anruf starten.",
        variant: "destructive",
      });
      return;
    }

    if (selectedCustomers.length === 0) {
      toast({
        title: "Keine Kunden ausgewählt",
        description: "Bitte wählen Sie mindestens einen Kunden für automatische Anrufe aus.",
        variant: "destructive",
      });
      return;
    }

    setIsCallActive(true);
    currentDialogRef.current = [];

    // Mock speech-to-text and GPT responses for now
    intervalRef.current = setInterval(() => {
      const newCustomerText = "Kunde spricht...";
      const newGptResponse = "GPT antwortet in Echtzeit...";

      setCustomerText(prev => prev + "\n" + newCustomerText);
      setGptResponse(prev => prev + "\n" + newGptResponse);

      currentDialogRef.current.push({
        customerText: newCustomerText,
        gptResponse: newGptResponse,
      });
    }, 3000);

    // Simulate call end after 15 seconds if not manually ended
    timerRef.current = setTimeout(() => {
      handleEndCall();
    }, 15000);
  };

  // Zeige Ladezustand für beide Queries
  if (isLoading || isLoadingProfile) {
    return <div>Lade...</div>;
  }

  return (
    <div className="space-y-6 w-full max-w-4xl">
      {/* Add Customer Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Neuen potenziellen Kunden hinzufügen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createCustomerMutation.mutate(data as Customer))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vorname</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nachname</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firma</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefonnummer</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" value={field.value || ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" value={field.value || ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Kunden hinzufügen
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Live Dialog */}
      {isCallActive && (
        <Card>
          <CardHeader>
            <CardTitle>Live Dialog</CardTitle>
          </CardHeader>
          <CardContent>
            <LiveDialog 
              customerText={customerText} 
              gptResponse={gptResponse} 
              assistantName={activeProfile?.name || "Assistent"}
              customerName={`${selectedCustomers[0]?.firstName} ${selectedCustomers[0]?.lastName}`.trim()}
            />
          </CardContent>
        </Card>
      )}

      {/* Customer Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Potenzielle Kunden für Auto-Anrufe
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!activeProfile && (
            <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg">
              ⚠️ Bitte aktivieren Sie zuerst ein Profil in den Profileinstellungen, bevor Sie Anrufe tätigen können.
            </div>
          )}
          <div className="space-y-4">
            <div className="grid gap-2">
              {customers?.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-2 border rounded hover:bg-muted"
                >
                  <div>
                    <p className="font-medium">
                      {customer.firstName} {customer.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {customer.company} • {customer.phoneNumber}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedCustomers.some(c => c.id === customer.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCustomers([...selectedCustomers, customer]);
                      } else {
                        setSelectedCustomers(selectedCustomers.filter(c => c.id !== customer.id));
                      }
                    }}
                    className="h-4 w-4"
                    disabled={!activeProfile}
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                className="w-full"
                onClick={startAutoCalls}
                disabled={selectedCustomers.length === 0 || isCallActive || !activeProfile}
              >
                <Phone className="mr-2 h-4 w-4" />
                {isCallActive ? "Anruf läuft..." : `Auto-Anrufe starten (${selectedCustomers.length} ausgewählt)`}
              </Button>

              {isCallActive && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleEndCall}
                >
                  <PhoneOff className="mr-2 h-4 w-4" />
                  Anruf beenden
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversation History */}
      <ConversationHistory 
        conversations={conversations}
        isLoading={false}
      />
    </div>
  );
}