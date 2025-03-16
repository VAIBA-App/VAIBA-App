import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, User, Plus, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AssistantForm {
  name: string;
  lastName: string;
  gender: string;
  age: string;
  origin: string;
  location: string;
  education: string;
  position: string;
  company: string;
  languages: string;
  profileImage: string;
}

interface Profile {
  name: string;
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
  id: number;
}


export default function AssistantPage() {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const { data: profiles = [], isLoading: isLoadingProfiles, refetch: refetchProfiles } = useQuery({
    queryKey: ['/api/profiles'],
    queryFn: async () => {
      const response = await fetch('/api/profiles');
      if (!response.ok) {
        throw new Error('Failed to fetch profiles');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Find active profile
  const activeProfile = profiles.find(p => p.isActive);

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold mb-8">Assistent anpassen</h1>

      {/* Profile List */}
      <ProfileList profiles={profiles} activateProfile={activateProfile} />

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Profil {isCreatingNew ? "erstellen" : "bearbeiten"}</CardTitle>
        </CardHeader>
        <CardContent>
          <EditProfileForm
            profile={activeProfile || {
              name: "",
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
              id: 0,
            }}
            isNewProfile={isCreatingNew}
            onSubmit={async (data: Profile) => {
              try {
                const profileData = {
                  name: `${data.name} `.trim(),
                  gender: data.gender,
                  age: data.age,
                  origin: data.origin,
                  location: data.location,
                  education: data.education,
                  position: data.position,
                  company: data.company,
                  languages: data.languages,
                  imageUrl: selectedImage ? URL.createObjectURL(selectedImage) : data.imageUrl,
                };

                const url = isCreatingNew ? '/api/profiles' : `/api/profiles/${data.id}`;
                const method = isCreatingNew ? 'POST' : 'PUT';

                const response = await fetch(url, {
                  method,
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(profileData),
                });

                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.message || (isCreatingNew ? 'Fehler beim Erstellen des Profils' : 'Fehler beim Aktualisieren des Profils'));
                }

                toast({
                  title: isCreatingNew ? "Profil erstellt" : "Profil aktualisiert",
                  description: isCreatingNew ? "Das neue Profil wurde erfolgreich erstellt." : "Die Änderungen wurden erfolgreich gespeichert.",
                });

                refetchProfiles();
              } catch (error) {
                console.error('Error:', error);
                toast({
                  title: "Fehler",
                  description: error instanceof Error ? error.message : "Die Änderungen konnten nicht gespeichert werden.",
                  variant: "destructive",
                });
              }
            }}
            onImageUpload={handleImageUpload}
          />
        </CardContent>
      </Card>
    </div>
  );
}


const ProfileList = ({ profiles, activateProfile }: { profiles: Profile[], activateProfile: (profileId: number) => Promise<void> }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Verfügbare Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className={`flex items-center justify-between p-4 border rounded-lg ${
                profile.isActive ? 'bg-primary/10' : ''
              }`}
            >
              <div>
                <p className="font-medium">{profile.name}</p>
                <p className="text-sm text-muted-foreground">{profile.position} bei {profile.company}</p>
              </div>
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
};


const EditProfileForm = ({ profile, isNewProfile, onSubmit, onImageUpload }: { profile: Profile, isNewProfile: boolean, onSubmit: (data: Profile) => Promise<void>, onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void }) => {
  const form = useForm<Profile>({ defaultValues: profile });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedImage(e.target.files?.[0]);
    onImageUpload(e);
  }


  return (
    <Form {...form} onSubmit={form.handleSubmit(onSubmit)}>
      <form className="space-y-4">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="w-32 h-32">
            <AvatarImage
              src={selectedImage ? URL.createObjectURL(selectedImage) : profile.imageUrl}
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
          {/* ... other form fields (gender, age, etc.) */}

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
              <FormLabel>Firma & Standort</FormLabel>
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
              <FormLabel>Sprachen</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit">
          {isNewProfile ? "Neues Profil erstellen" : "Profil aktualisieren"}
        </Button>
      </form>
    </Form>
  );
};


const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    setSelectedImage(file);
    toast({
      title: "Bild hochgeladen",
      description: "Das Profilbild wurde hochgeladen. Speichern Sie das Profil, um die Änderungen zu übernehmen.",
    });
  }
};

const activateProfile = async (profileId: number) => {
  try {
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

    await refetchProfiles();

    toast({
      title: "Profil aktiviert",
      description: "Das ausgewählte Profil wurde erfolgreich aktiviert.",
    });
  } catch (error) {
    toast({
      title: "Fehler",
      description: "Das Profil konnte nicht aktiviert werden.",
      variant: "destructive",
    });
  }
};