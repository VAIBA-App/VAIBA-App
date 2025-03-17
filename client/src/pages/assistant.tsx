import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, User, Plus, Check, Trash2, Mic } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VoiceSettings } from "@/components/voice/VoiceSettings";
import { useLocation } from "wouter";

interface Profile {
  id: number;
  name: string;
  lastName?: string;
  gender: string;
  age: number;
  origin: string;
  location: string;
  education: string;
  position: string;
  company: string;
  languages: string[];
  imageUrl: string;
  isActive: boolean;
  voiceId?: string;
  voiceSettings?: {
    stability: number;
    similarityBoost: number;
    style: number;
    speed: number;
  };
}

const emptyProfile: Profile = {
  id: 0,
  name: "",
  lastName: "",
  gender: "",
  age: 25,
  origin: "",
  location: "",
  education: "",
  position: "",
  company: "",
  languages: [],
  imageUrl: "/default-avatar.png",
  isActive: false,
  voiceId: "",
  voiceSettings: {
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0,
    speed: 1,
  },
};

function getBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

export default function AssistantPage() {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState<Record<number, boolean>>({});
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const editFormRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [_, setLocation] = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  // Add polling to keep profile list updated
  const { data: profilesData, isLoading: isLoadingProfiles, refetch: refetchProfiles } = useQuery<Profile[]>({
    queryKey: ['/api/profiles'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/profiles');
        if (!response.ok) {
          throw new Error('Failed to fetch profiles');
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching profiles:', error);
        return [];
      }
    },
    refetchInterval: 5000, // Poll every 5 seconds
    refetchOnWindowFocus: true,
    initialData: [] as Profile[],
  });

  // Ensure profiles is always an array
  const profiles = Array.isArray(profilesData) ? profilesData : [];

  useEffect(() => {
    // Initial fetch of profiles
    refetchProfiles();
  }, [refetchProfiles]);

  useEffect(() => {
    if (isNavigating) {
      const timer = setTimeout(() => {
        setLocation('/assistant');
        setIsNavigating(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isNavigating, setLocation]);

  const getVoiceName = (voiceId: string) => {
    const voice = Array.isArray(voicesList) ? voicesList.find((v: any) => v.voice_id === voiceId) : null;
    return voice ? voice.name : '';
  };

  const activateProfile = async (profileId: number) => {
    try {
      const deactivateResponse = await fetch('/api/profiles/deactivate-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!deactivateResponse.ok) {
        throw new Error('Failed to deactivate profiles');
      }

      const response = await fetch('/api/profiles/active', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileId }),
      });

      if (!response.ok) {
        throw new Error('Failed to activate profile');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      await refetchProfiles();

      toast({
        title: "Profil aktiviert",
        description: "Das ausgewählte Profil wurde erfolgreich aktiviert.",
      });

      setLocation('/');
      setIsNavigating(true);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Das Profil konnte nicht aktiviert werden.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSelectedProfiles = async () => {
    const selectedIds = Object.entries(selectedProfiles)
      .filter(([_, selected]) => selected)
      .map(([id]) => parseInt(id));

    if (selectedIds.length === 0) {
      toast({
        title: "Keine Profile ausgewählt",
        description: "Bitte wählen Sie mindestens ein Profil zum Löschen aus.",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Möchten Sie ${selectedIds.length} Profile wirklich löschen?`)) {
      try {
        await Promise.all(
          selectedIds.map((id) =>
            fetch(`/api/profiles/${id}`, { method: 'DELETE' })
          )
        );

        toast({
          title: "Profile gelöscht",
          description: `${selectedIds.length} Profile wurden erfolgreich gelöscht.`,
        });

        setSelectedProfiles({});
        await queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
        await refetchProfiles();
      } catch (error) {
        toast({
          title: "Fehler",
          description: "Die Profile konnten nicht gelöscht werden.",
          variant: "destructive",
        });
      }
    }
  };

  const toggleProfileSelection = (id: number) => {
    setSelectedProfiles(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleAllProfiles = () => {
    if (profiles.length === 0) return;

    const allSelected = profiles.every(profile => selectedProfiles[profile.id]);
    if (allSelected) {
      setSelectedProfiles({});
    } else {
      const newSelected = profiles.reduce((acc, profile) => {
        acc[profile.id] = true;
        return acc;
      }, {} as Record<number, boolean>);
      setSelectedProfiles(newSelected);
    }
  };

  const { data: voicesList = [] } = useQuery({
    queryKey: ['voices'],
    queryFn: async () => {
      try {
        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
          headers: {
            'xi-api-key': import.meta.env.VITE_ELEVENLABS_API_KEY,
          },
        });
        if (!response.ok) return [];
        const data = await response.json();
        return data.voices || [];
      } catch (error) {
        console.error('Error fetching voices:', error);
        return [];
      }
    },
  });


  if (isLoadingProfiles) {
    return <div>Lade Profile...</div>;
  }

  const handleEditProfile = (profile: Profile) => {
    setIsCreatingNew(false);
    setSelectedProfile(profile);
    // Scroll to edit form
    setTimeout(() => {
      editFormRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Assistent anpassen</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Verfügbare Profile</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                onClick={handleDeleteSelectedProfiles}
                disabled={Object.keys(selectedProfiles).length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Ausgewählte löschen
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                type="checkbox"
                checked={profiles.length > 0 && profiles.every(profile => selectedProfiles[profile.id])}
                onChange={toggleAllProfiles}
                className="w-4 h-4"
              />
              <span className="text-sm">Alle auswählen</span>
            </div>
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  profile.isActive ? 'bg-primary/10' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <Input
                    type="checkbox"
                    checked={selectedProfiles[profile.id]}
                    onChange={() => toggleProfileSelection(profile.id)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {profile.name}
                        {profile.lastName ? ` ${profile.lastName}` : ''}
                      </p>
                      {profile.voiceId && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mic className="h-4 w-4 mr-1" />
                          <span>Stimme ausgewählt: {getVoiceName(profile.voiceId)}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {profile.position} bei {profile.company}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleEditProfile(profile)}
                    variant="outline"
                  >
                    Bearbeiten
                  </Button>
                  <Button
                    onClick={() => activateProfile(profile.id)}
                    variant={profile.isActive ? "secondary" : "outline"}
                    disabled={profile.isActive}
                  >
                    {profile.isActive ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Aktiv
                      </>
                    ) : (
                      "Aktivieren"
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div ref={editFormRef}>
        <Card>
          <CardHeader>
            <CardTitle>{isCreatingNew ? "Neues Profil erstellen" : "Profil bearbeiten"}</CardTitle>
          </CardHeader>
          <CardContent>
            <EditProfileForm
              profile={isCreatingNew ? emptyProfile : (selectedProfile || emptyProfile)}
              isNewProfile={isCreatingNew}
              onSuccess={async () => {
                await queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
                await refetchProfiles();
                setIsCreatingNew(false);
                setSelectedProfile(null);
                toast({
                  title: isCreatingNew ? "Profil erstellt" : "Profil aktualisiert",
                  description: isCreatingNew
                    ? "Das neue Profil wurde erfolgreich erstellt."
                    : "Das Profil wurde erfolgreich aktualisiert.",
                });
              }}
            />
          </CardContent>
        </Card>
      </div>

      {!isCreatingNew && !selectedProfile && (
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setIsCreatingNew(true);
              setSelectedProfile(null);
            }}
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Neues Profil erstellen
          </Button>
        </div>
      )}
    </div>
  );
}

interface EditProfileFormProps {
  profile: Profile;
  isNewProfile: boolean;
  onSuccess: () => void;
}

function EditProfileForm({ profile, isNewProfile, onSuccess }: EditProfileFormProps) {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const form = useForm<Profile>({
    defaultValues: {
      ...profile,
      languages: Array.isArray(profile.languages) ? profile.languages : [],
      voiceSettings: profile.voiceSettings || {
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0,
        speed: 1,
      }
    }
  });

  useEffect(() => {
    form.reset({
      ...profile,
      languages: Array.isArray(profile.languages) ? profile.languages : [],
      voiceSettings: profile.voiceSettings || {
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0,
        speed: 1,
      }
    });
  }, [profile, form]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await getBase64(file);
        setSelectedImage(file);
        form.setValue('imageUrl', base64);
      } catch (error) {
        console.error('Error converting image to base64:', error);
        toast({
          title: "Fehler",
          description: "Das Bild konnte nicht verarbeitet werden.",
          variant: "destructive",
        });
      }
    }
  };

  const onSubmit = async (data: Profile) => {
    try {
      let imageUrl = data.imageUrl;

      if (selectedImage) {
        try {
          imageUrl = await getBase64(selectedImage);
        } catch (error) {
          console.error('Error converting image to base64:', error);
          toast({
            title: "Fehler",
            description: "Das Bild konnte nicht verarbeitet werden.",
            variant: "destructive",
          });
          return;
        }
      }

      if (isNewProfile) {
        const existingProfiles = await fetch('/api/profiles').then(res => res.json());
        const isFirstProfile = !existingProfiles || existingProfiles.length === 0;

        const response = await fetch('/api/profiles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            name: data.name.trim(),
            lastName: data.lastName?.trim(),
            imageUrl,
            languages: Array.isArray(data.languages)
              ? data.languages
              : (data.languages || '').toString().split(',').map(lang => lang.trim()),
            isActive: isFirstProfile,
          }),
        });

        if (!response.ok) {
          throw new Error('Fehler beim Erstellen des Profils');
        }
      } else {
        const response = await fetch(`/api/profiles/${profile.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            name: data.name.trim(),
            lastName: data.lastName?.trim(),
            imageUrl,
            languages: Array.isArray(data.languages)
              ? data.languages
              : (data.languages || '').toString().split(',').map(lang => lang.trim()),
          }),
        });

        if (!response.ok) {
          throw new Error('Fehler beim Aktualisieren des Profils');
        }
      }

      onSuccess();
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Die Änderungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="w-32 h-32">
            <AvatarImage
              src={form.watch('imageUrl') || profile.imageUrl}
              alt="Profilbild"
            />
            <AvatarFallback>
              <User className="w-16 h-16 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="profile-image"
            />
            <label htmlFor="profile-image">
              <Button type="button" variant="outline" className="cursor-pointer" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Bild hochladen
                </span>
              </Button>
            </label>
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vorname</FormLabel>
              <FormControl>
                <Input {...field} />
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
                <Input {...field} value={field.value || ''} />
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen Sie ein Geschlecht" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="weiblich">Weiblich</SelectItem>
                  <SelectItem value="männlich">Männlich</SelectItem>
                  <SelectItem value="divers">Divers</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

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
              <FormLabel>Wurzeln</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wohnort</FormLabel>
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
              <FormLabel>Bildung</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />

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

        <FormField
          control={form.control}
          name="languages"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sprachen (kommagetrennt)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                  onChange={(e) => field.onChange(e.target.value.split(',').map(lang => lang.trim()))}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="space-y-4 border rounded-lg p-4">
          <h3 className="text-lg font-medium">Stimme auswählen</h3>
          <VoiceSettings
            onSettingsChange={handleVoiceSettingsChange}
            initialVoiceId={profile.voiceId}
            initialSettings={profile.voiceSettings}
          />
        </div>

        <Button type="submit">
          {isNewProfile ? "Profil erstellen" : "Profil aktualisieren"}
        </Button>
      </form>
    </Form>
  );
}