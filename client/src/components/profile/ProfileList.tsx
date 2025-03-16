import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, Check, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EditProfileForm } from "./EditProfileForm";
import type { Profile } from "@db/schema";
import { Checkbox } from "@/components/ui/checkbox";

export function ProfileList() {
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [selectedProfiles, setSelectedProfiles] = useState<Record<number, boolean>>({});
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
    onSuccess: () => {
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
        title: "Profile gelöscht",
        description: "Die ausgewählten Profile wurden erfolgreich gelöscht.",
      });
      setSelectedProfiles({});
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Profile konnten nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  const handleSetActiveProfile = (profileId: number) => {
    setActiveProfileMutation.mutate(profileId);
  };

  const handleDeleteSelectedProfiles = () => {
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
      selectedIds.forEach(id => deleteProfileMutation.mutate(id));
    }
  };

  const toggleProfileSelection = (id: number) => {
    setSelectedProfiles(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleAllProfiles = () => {
    if (!profiles || profiles.length === 0) return;

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

  // Finde das aktive Profil
  const activeProfile = profiles?.find(p => p.isActive);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Verfügbare Profile
          </CardTitle>
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
        {isLoading ? (
          <div>Lade Profile...</div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-4">
              <Checkbox
                checked={profiles?.length > 0 && profiles.every(profile => selectedProfiles[profile.id])}
                onCheckedChange={toggleAllProfiles}
                id="select-all"
              />
              <label htmlFor="select-all" className="text-sm">Alle auswählen</label>
            </div>
            <div className="grid gap-4">
              {profiles?.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted"
                >
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedProfiles[profile.id]}
                      onCheckedChange={() => toggleProfileSelection(profile.id)}
                    />
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
          </div>
        )}
      </CardContent>

      <Sheet open={!!editingProfile} onOpenChange={() => setEditingProfile(null)}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>
              {editingProfile?.isActive ? "Aktives Profil bearbeiten" : "Profil bearbeiten"}
            </SheetTitle>
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