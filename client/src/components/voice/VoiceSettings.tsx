import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { elevenLabsService } from "@/lib/elevenlabs";
import { Mic } from "lucide-react";

interface VoiceSettingsProps {
  onSettingsChange: (settings: {
    voiceId: string;
    stability: number;
    similarityBoost: number;
    style: number;
    speed: number;
  }) => void;
}

export function VoiceSettings({ onSettingsChange }: VoiceSettingsProps) {
  const [voices, setVoices] = useState<Array<{ voice_id: string; name: string }>>([]);
  const [selectedVoice, setSelectedVoice] = useState("21m00Tcm4TlvDq8ikWAM");
  const [settings, setSettings] = useState({
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0.0,
    speed: 1.0,
  });

  useEffect(() => {
    loadVoices();
  }, []);

  useEffect(() => {
    onSettingsChange({
      voiceId: selectedVoice,
      ...settings,
    });
  }, [selectedVoice, settings, onSettingsChange]);

  const loadVoices = async () => {
    try {
      const availableVoices = await elevenLabsService.getVoices();
      setVoices(availableVoices);
    } catch (error) {
      console.error("Failed to load voices:", error);
    }
  };

  const handleSettingChange = (key: keyof typeof settings, value: number) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      return newSettings;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Spracheinstellungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Stimme auswählen</Label>
          <Select value={selectedVoice} onValueChange={setSelectedVoice}>
            <SelectTrigger>
              <SelectValue placeholder="Wähle eine Stimme" />
            </SelectTrigger>
            <SelectContent>
              {voices.map((voice) => (
                <SelectItem key={voice.voice_id} value={voice.voice_id}>
                  {voice.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Stabilität ({Math.round(settings.stability * 100)}%)</Label>
            <Slider
              value={[settings.stability * 100]}
              onValueChange={([value]) => handleSettingChange('stability', value / 100)}
              min={0}
              max={100}
            />
          </div>

          <div className="space-y-2">
            <Label>Ähnlichkeit ({Math.round(settings.similarityBoost * 100)}%)</Label>
            <Slider
              value={[settings.similarityBoost * 100]}
              onValueChange={([value]) => handleSettingChange('similarityBoost', value / 100)}
              min={0}
              max={100}
            />
          </div>

          <div className="space-y-2">
            <Label>Stil-Betonung ({Math.round(settings.style * 100)}%)</Label>
            <Slider
              value={[settings.style * 100]}
              onValueChange={([value]) => handleSettingChange('style', value / 100)}
              min={0}
              max={100}
            />
          </div>

          <div className="space-y-2">
            <Label>Geschwindigkeit ({settings.speed.toFixed(1)}x)</Label>
            <Slider
              value={[settings.speed * 50]}
              onValueChange={([value]) => handleSettingChange('speed', value / 50)}
              min={25}
              max={75}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
