import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, Check, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EditProfileForm } from "./EditProfileForm";
import { Profile } from "@db/schema";

export function ProfileList() {
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['/api/profiles'],
    queryFn: async () => {
      const response = await fetch('/api/profiles');
      if (!response.ok) throw new Error('Failed to fetch profiles');
      return response.json() as Promise<Profile[]>;
    },
  });

  const setActiveProfileMutation = useMutation({
    mutationFn: async (profileId: number) => {
      const response = await fetch('/api/profiles/active', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileId }),
      });

      if (!response.ok) throw new Error('Failed to set active profile');
      return response.json();
    },
    onSuccess: (_, profileId) => {
      setActiveProfileId(profileId);
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      toast({
        title: "Aktives Profil gesetzt",
        description: "Das ausgewählte Profil wird nun für Anrufe verwendet.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Das Profil konnte nicht aktiviert werden.",
        variant: "destructive",
      });
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async (profileId: number) => {
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete profile');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      toast({
        title: "Profil gelöscht",
        description: "Das Profil wurde erfolgreich gelöscht.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Das Profil konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  const handleSetActiveProfile = (profileId: number) => {
    setActiveProfileMutation.mutate(profileId);
  };

  const handleDeleteProfile = (profileId: number) => {
    if (window.confirm('Möchten Sie dieses Profil wirklich löschen?')) {
      deleteProfileMutation.mutate(profileId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Verfügbare Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Lade Profile...</div>
        ) : (
          <div className="grid gap-4">
            {profiles?.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{profile.name}</h3>
                    <Badge variant="outline">{profile.gender}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {profile.position} bei {profile.company}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sprachen: {profile.languages.join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setEditingProfile(profile)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteProfile(profile.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={profile.isActive ? "default" : "outline"}
                    onClick={() => handleSetActiveProfile(profile.id)}
                    className="ml-4"
                  >
                    {profile.isActive ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
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
        )}
      </CardContent>

      <Sheet open={!!editingProfile} onOpenChange={() => setEditingProfile(null)}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Profil bearbeiten</SheetTitle>
          </SheetHeader>
          {editingProfile && (
            <EditProfileForm 
              profile={editingProfile} 
              onSuccess={() => {
                setEditingProfile(null);
                queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}