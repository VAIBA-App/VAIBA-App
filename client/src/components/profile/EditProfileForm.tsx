import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProfileSchema } from "@db/schema";
import type { Profile } from "@db/schema";
import { VoiceSettings } from "@/components/voice/VoiceSettings";

interface EditProfileFormProps {
  profile: Profile;
  onSuccess: () => void;
}

export function EditProfileForm({ profile, onSuccess }: EditProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertProfileSchema),
    defaultValues: {
      name: profile.name,
      gender: profile.gender,
      age: profile.age,
      origin: profile.origin,
      location: profile.location,
      education: profile.education,
      position: profile.position,
      company: profile.company,
      languages: profile.languages,
      imageUrl: profile.imageUrl || "",
      voiceId: profile.voiceId || "",
      voiceSettings: profile.voiceSettings || {
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0,
        speed: 1,
      },
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<Profile>) => {
      try {
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

        const response = await fetch(`/api/profiles/${profile.id}`, {
          method: 'PUT',
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
          throw new Error(errorData.message || 'Failed to update profile');
        }

        return response.json();
      } catch (error) {
        console.error('Profile update error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Profil aktualisiert",
        description: "Die Änderungen wurden erfolgreich gespeichert.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      console.error('Profile update error:', error);
      toast({
        title: "Fehler",
        description: error.message || "Das Profil konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

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
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4 mt-6">
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
                  {(selectedImage || field.value) && (
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
          <VoiceSettings
            onSettingsChange={handleVoiceSettingsChange}
            initialVoiceId={profile.voiceId || undefined}
            initialSettings={profile.voiceSettings || undefined}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Wird gespeichert..." : "Änderungen speichern"}
        </Button>
      </form>
    </Form>
  );
}