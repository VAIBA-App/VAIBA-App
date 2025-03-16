import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProfileSchema } from "@db/schema";
import type { Profile } from "@db/schema";
import { VoiceSettings } from "@/components/voice/VoiceSettings";
import { profileApi } from "@/lib/api";

interface EditProfileFormProps {
  profile: Profile;
  onSuccess: () => void;
  isNewProfile?: boolean;
}

export function EditProfileForm({ profile, onSuccess, isNewProfile = false }: EditProfileFormProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
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

        const profileData = {
          ...data,
          imageUrl,
          languages: Array.isArray(data.languages)
            ? data.languages
            : data.languages.split(',').map((lang: string) => lang.trim()),
        };

        if (isNewProfile) {
          return await profileApi.create(profileData);
        } else {
          return await profileApi.update(profile.id, profileData);
        }
      } catch (error) {
        console.error('Profile operation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      toast({
        title: isNewProfile ? "Profil erstellt" : "Profil aktualisiert",
        description: isNewProfile
          ? "Das neue Profil wurde erfolgreich erstellt."
          : "Die Änderungen wurden erfolgreich gespeichert.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: isNewProfile
          ? "Das Profil konnte nicht erstellt werden."
          : "Das Profil konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      form.setValue('imageUrl', URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: any) => {
    await mutation.mutateAsync(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
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
                  <Input {...field} type="number" />
                </FormControl>
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
                />
              </FormControl>
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
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Stimmenauswahl</h3>
          <VoiceSettings
            onSettingsChange={() => {}}
            initialVoiceId={profile.voiceId}
          />
        </div>

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending
            ? (isNewProfile ? "Wird erstellt..." : "Wird aktualisiert...")
            : (isNewProfile ? "Profil erstellen" : "Profil aktualisieren")
          }
        </Button>
      </form>
    </Form>
  );
}