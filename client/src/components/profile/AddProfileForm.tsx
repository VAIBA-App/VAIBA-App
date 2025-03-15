import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Upload } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProfileSchema } from "@db/schema";
import type { Profile } from "@db/schema";
import { VoiceSettings } from "@/components/voice/VoiceSettings";

export function AddProfileForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(insertProfileSchema),
    defaultValues: {
      name: "",
      gender: "",
      age: 30,
      origin: "",
      location: "",
      education: "",
      position: "",
      company: "",
      languages: [],
      imageUrl: "",
      voiceId: "",
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0,
        speed: 1,
      },
    },
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: Omit<Profile, "id" | "createdAt" | "updatedAt">) => {
      try {
        // Handle image upload if a file is selected
        let imageUrl = data.imageUrl;
        if (selectedImage) {
          const formData = new FormData();
          formData.append('image', selectedImage);

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload image');
          }

          const uploadResult = await uploadResponse.json();
          imageUrl = uploadResult.url;
        }

        // Create profile with image URL
        const response = await fetch('/api/profiles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            imageUrl,
            languages: Array.isArray(data.languages) 
              ? data.languages 
              : String(data.languages).split(',').map(lang => lang.trim()),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create profile');
        }

        return response.json();
      } catch (error) {
        console.error('Profile creation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      form.reset();
      setSelectedImage(null);
      toast({
        title: "Profil erstellt",
        description: "Das neue Profil wurde erfolgreich angelegt.",
      });
    },
    onError: (error: Error) => {
      console.error('Profile creation error:', error);
      toast({
        title: "Fehler",
        description: error.message || "Das Profil konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: Profile) => {
    setIsSubmitting(true);
    try {
      await createProfileMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // Update the form's imageUrl field with the file name for display
      form.setValue('imageUrl', file.name);
    }
  };

  const handleVoiceSettingsChange = (settings: {
    voiceId: string;
    stability: number;
    similarityBoost: number;
    style: number;
    speed: number;
  }) => {
    form.setValue('voiceId', settings.voiceId);
    form.setValue('voiceSettings', {
      stability: settings.stability,
      similarityBoost: settings.similarityBoost,
      style: settings.style,
      speed: settings.speed,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Neues Profil erstellen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Geschlecht</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alter</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Herkunft</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Standort</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="education"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ausbildung</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firma</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="languages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sprachen (kommagetrennt)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={Array.isArray(field.value) ? field.value.join(', ') : field.value}
                      onChange={(e) => field.onChange(e.target.value.split(',').map(lang => lang.trim()))}
                      placeholder="Deutsch, Englisch, ..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profilbild</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="flex-1"
                      />
                      {selectedImage && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setSelectedImage(null);
                            form.setValue('imageUrl', '');
                          }}
                        >
                          Entfernen
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Voice Settings */}
            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="text-lg font-medium">Stimme auswählen</h3>
              <VoiceSettings onSettingsChange={handleVoiceSettingsChange} />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Wird erstellt..." : "Profil erstellen"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}