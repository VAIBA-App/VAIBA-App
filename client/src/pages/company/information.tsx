import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import React from 'react';

// Schema definition remains the same
const companyInformationSchema = z.object({
  name: z.string().optional(),
  industry: z.string().optional(),
  services: z.object({
    onlineService: z.boolean().optional(),
    localService: z.boolean().optional(),
    onlineProduct: z.boolean().optional(),
    localProduct: z.boolean().optional(),
  }),
  address: z.object({
    street: z.string().optional(),
    zipCode: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
  }),
  email: z.string().email().optional(),
  website: z.string().url().optional().or(z.literal("")),
  vatId: z.string().optional(),
});

type CompanyInformation = z.infer<typeof companyInformationSchema>;

const serviceOptions = [
  {
    id: "onlineService",
    label: "Dienstleistung (online)",
  },
  {
    id: "localService",
    label: "Dienstleistung (lokales Geschäft)",
  },
  {
    id: "onlineProduct",
    label: "Produktverkauf (E-Commerce)",
  },
  {
    id: "localProduct",
    label: "Produktverkauf (lokales Geschäft)",
  },
];

export default function CompanyInformation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CompanyInformation>({
    resolver: zodResolver(companyInformationSchema),
    defaultValues: {
      name: "",
      industry: "",
      services: {
        onlineService: false,
        localService: false,
        onlineProduct: false,
        localProduct: false,
      },
      address: {
        street: "",
        zipCode: "",
        city: "",
        country: "",
      },
      email: "",
      website: "",
      vatId: "",
    },
  });

  // Query to fetch saved company information
  const { data: savedData } = useQuery({
    queryKey: ['companyInformation'],
    queryFn: async () => {
      const response = await fetch("/api/company/information");
      if (!response.ok) {
        return null;
      }
      return response.json();
    },
  });

  // Update form when saved data is loaded
  React.useEffect(() => {
    if (savedData) {
      form.reset(savedData);
    }
  }, [savedData, form]);

  const saveCompanyInfo = useMutation({
    mutationFn: async (data: CompanyInformation) => {
      try {
        const response = await fetch("/api/company/information", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to save company information");
        }

        return response.json();
      } catch (error) {
        console.error("Save error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyInformation'] });
      toast({
        title: "Erfolgreich gespeichert",
        description: "Die Unternehmensinformationen wurden gespeichert.",
      });
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      let errorMessage = "Ein Fehler ist aufgetreten.";
      if (error.response && error.response.status) {
        switch (error.response.status) {
          case 400:
            errorMessage = "Ungültige Daten. Bitte überprüfen Sie Ihre Eingaben.";
            break;
          case 500:
            errorMessage = "Ein interner Serverfehler ist aufgetreten.";
            break;
          default:
            errorMessage = `Fehlercode: ${error.response.status}. Bitte versuchen Sie es später erneut.`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Fehler",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CompanyInformation) => {
    saveCompanyInfo.mutate(data);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold mb-8">Unternehmensinformationen</h1>

      <Card>
        <CardHeader>
          <CardTitle>Informationen</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name des Unternehmens</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branche / Nische</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="z.B. Fitness, E-Commerce, Coaching" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel>Angebot</FormLabel>
                {serviceOptions.map((option) => (
                  <FormField
                    key={option.id}
                    control={form.control}
                    name={`services.${option.id}`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {option.label}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <div className="space-y-4">
                <FormLabel>Standort</FormLabel>
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="address.street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Straße & Hausnummer</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address.zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PLZ</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stadt</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="address.country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Land</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vatId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Umsatzsteuer-ID / Steuer-ID</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full"
                disabled={saveCompanyInfo.isPending}
              >
                {saveCompanyInfo.isPending ? "Speichert..." : "Speichern"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}