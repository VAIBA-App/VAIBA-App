import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, User, Plus } from "lucide-react";
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
  voice: string;
  speed: number;
  stability: number;
  similarity: number;
  styleExaggeration: number;
}

export default function AssistantPage() {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Fetch all profiles
  const { data: profiles = [], isLoading: isLoadingProfiles, refetch: refetchProfiles } = useQuery({
    queryKey: ['/api/profiles'],
    queryFn: async () => {
      const response = await fetch('/api/profiles');
      if (!response.ok) {
        throw new Error('Failed to fetch profiles');
      }
      const data = await response.json();
      console.log('Fetched profiles:', data);
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch active profile
  const { data: activeProfile } = useQuery({
    queryKey: ['/api/profile'],
    queryFn: async () => {
      const response = await fetch('/api/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch active profile');
      }
      return response.json();
    },
  });

  const form = useForm<AssistantForm>({
    defaultValues: {
      name: "Maria",
      lastName: "Adams",
      gender: "weiblich",
      age: "26",
      origin: "Irisch",
      location: "Stuttgart",
      education: "Studium der Informatik in Dublin",
      position: "Stellvertretende Geschäftsführerin und Sales Managerin",
      company: "TecSpec in Stuttgart",
      languages: "Englisch und Deutsch",
      profileImage: "/default-avatar.png",
      voice: "",
      speed: 1.0,
      stability: 0.5,
      similarity: 0.75,
      styleExaggeration: 0.3,
    },
  });

  const onSubmit = async (data: AssistantForm) => {
    try {
      const profileData = {
        name: `${data.name} ${data.lastName}`.trim(),
        gender: data.gender,
        age: parseInt(data.age),
        origin: data.origin,
        location: data.location,
        education: data.education,
        position: data.position,
        company: data.company,
        languages: data.languages.split(',').map(lang => lang.trim()),
        imageUrl: selectedImage ? URL.createObjectURL(selectedImage) : "/default-avatar.png",
        isActive: isCreatingNew ? false : activeProfile?.isActive, //added
      };

      let url = '/api/profiles';
      let method = 'POST';
      if (!isCreatingNew && activeProfile?.id) {
        url = `/api/profiles/${activeProfile.id}`;
        method = 'PUT';
        delete profileData.isActive; //remove for update
      }


      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || (method === 'POST' ? 'Failed to create profile' : "Fehler beim Aktualisieren des Profils"));
      }

      const successMessage = isCreatingNew ? "Profil erstellt" : "Profil aktualisiert";
      toast({
        title: successMessage,
        description: isCreatingNew ? "Das neue Profil wurde erfolgreich erstellt." : "Die Änderungen wurden erfolgreich gespeichert.",
      });
      setIsCreatingNew(false);
      refetchProfiles();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Die Änderungen konnten nicht gespeichert werden.",
        variant: "destructive",
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

      toast({
        title: "Profil aktiviert",
        description: "Das ausgewählte Profil wurde aktiviert.",
      });
      refetchProfiles();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Das Profil konnte nicht aktiviert werden.",
        variant: "destructive",
      });
    }
  };

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setSelectedImage(file);
        toast({
          title: "Bild hochgeladen",
          description: "Das Profilbild wurde erfolgreich hochgeladen. Speichern Sie das Profil um die Änderungen zu übernehmen.",
        });
      } catch (error) {
        console.error('Error during image upload:', error);
        toast({
          title: "Fehler beim Upload",
          description: "Das Bild konnte nicht hochgeladen werden. Bitte versuchen Sie es erneut.",
          variant: "destructive",
        });
      }
    }
  }

  if (isLoadingProfiles) {
    return <div>Lade...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold mb-8">Assistent anpassen</h1>

      {/* Profile List */}
      <Card>
        <CardHeader>
          <CardTitle>Verfügbare Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {profiles.map((profile: any) => (
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
                  {profile.isActive ? "Aktiv" : "Aktivieren"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verkäuferprofil */}
        <Card>
          <CardHeader>
            <CardTitle>Verkäuferprofil</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-32 h-32">
                    <AvatarImage
                      src={selectedImage ? URL.createObjectURL(selectedImage) : (activeProfile?.imageUrl || "/default-avatar.png")}
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
                      onChange={handleImageUpload}
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

                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={async (e) => {
                      e.preventDefault();
                      setIsCreatingNew(false);
                      const values = form.getValues();
                      await onSubmit(values);
                    }}
                  >
                    Profil aktualisieren
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={async (e) => {
                      e.preventDefault();
                      setIsCreatingNew(true);
                      const values = form.getValues();
                      await onSubmit(values);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Neues Profil erstellen
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Stimmeneinstellungen */}
        <Card>
          <CardHeader>
            <CardTitle>Stimmeneinstellungen</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-6">
                <FormField
                  control={form.control}
                  name="voice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stimme auswählen</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Wählen Sie eine Stimme" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="voice1">Stimme 1</SelectItem>
                          <SelectItem value="voice2">Stimme 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="speed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Geschwindigkeit ({field.value}x)</FormLabel>
                        <FormControl>
                          <Slider
                            min={0.5}
                            max={2.0}
                            step={0.1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stabilität ({Math.round(field.value * 100)}%)</FormLabel>
                        <FormControl>
                          <Slider
                            min={0}
                            max={1}
                            step={0.1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="similarity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ähnlichkeit ({Math.round(field.value * 100)}%)</FormLabel>
                        <FormControl>
                          <Slider
                            min={0}
                            max={1}
                            step={0.1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="styleExaggeration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stil-Übertreibung ({Math.round(field.value * 100)}%)</FormLabel>
                        <FormControl>
                          <Slider
                            min={0}
                            max={1}
                            step={0.1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}