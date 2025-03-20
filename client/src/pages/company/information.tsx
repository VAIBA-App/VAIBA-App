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
import React, { useState, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      website: "http://",
      vatId: "",
    },
  });

  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  const validateAddressMutation = useMutation({
    mutationFn: async (address: CompanyInformation['address']) => {
      const response = await fetch("/api/validate-address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        throw new Error('Failed to validate address');
      }

      return response.json();
    },
  });

  const handleAddressValidation = async (address: CompanyInformation['address']) => {
    try {
      const result = await validateAddressMutation.mutateAsync(address);
      setAddressErrors(result.errors || {});
      return result.isValid;
    } catch (error) {
      console.error('Address validation error:', error);
      toast({
        title: "Fehler",
        description: "Adressvalidierung fehlgeschlagen",
        variant: "destructive",
      });
      return false;
    }
  };

  const saveCompanyInfo = useMutation({
    mutationFn: async (data: CompanyInformation) => {
      try {
        const response = await fetch("/api/company/information", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: data.name,
            industry: data.industry,
            services: {
              onlineService: data.services?.onlineService || false,
              localService: data.services?.localService || false,
              onlineProduct: data.services?.onlineProduct || false,
              localProduct: data.services?.localProduct || false,
            },
            address: {
              street: data.address?.street || '',
              zipCode: data.address?.zipCode || '',
              city: data.address?.city || '',
              country: data.address?.country || '',
            },
            email: data.email || '',
            website: data.website || 'http://',
            vatId: data.vatId || '',
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server response:", errorText);
          throw new Error(`Failed to save company information: ${response.statusText}`);
        }

        try {
          return await response.json();
        } catch (error) {
          console.error("Failed to parse response:", error);
          return { success: true };
        }
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
      console.error("Save error:", error);
      toast({
        title: "Fehler",
        description: "Fehler beim Speichern der Unternehmensinformationen. Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CompanyInformation) => {
    const isAddressValid = await handleAddressValidation(data.address);

    if (!isAddressValid) {
      toast({
        title: "Validierungsfehler",
        description: "Bitte überprüfen Sie die Adressangaben",
        variant: "destructive",
      });
      return;
    }

    saveCompanyInfo.mutate(data);
  };

  const { data: savedData } = useQuery({
    queryKey: ['companyInformation'],
    queryFn: async () => {
      try {
        const response = await fetch("/api/company/information");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data && data.website && !data.website.startsWith('http://') && !data.website.startsWith('https://')) {
          data.website = `http://${data.website}`;
        }
        return data;
      } catch (error) {
        console.error("Failed to fetch company information:", error);
        return null;
      }
    },
  });

  React.useEffect(() => {
    if (savedData) {
      form.reset(savedData);
    }
  }, [savedData, form]);


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
                        {addressErrors.street && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              {addressErrors.street}
                            </AlertDescription>
                          </Alert>
                        )}
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
                          {addressErrors.zipCode && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                {addressErrors.zipCode}
                              </AlertDescription>
                            </Alert>
                          )}
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
                          {addressErrors.city && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                {addressErrors.city}
                              </AlertDescription>
                            </Alert>
                          )}
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
                        {addressErrors.country && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              {addressErrors.country}
                            </AlertDescription>
                          </Alert>
                        )}
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