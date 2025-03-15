import { z } from "zod";

export class ElevenLabsService {
  private apiKey: string;
  private model: string = "eleven_multilingual_v2";

  constructor() {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error("ElevenLabs API key is not configured");
    }
    this.apiKey = apiKey.trim();
  }

  async getVoices(): Promise<Array<{ voice_id: string; name: string }>> {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.voices.map((voice: any) => ({
        voice_id: voice.voice_id,
        name: voice.name,
      }));
    } catch (error: any) {
      console.error("Error fetching voices:", error);
      throw error;
    }
  }

  async speakText(text: string, voiceId: string, settings: {
    stability: number;
    similarity_boost: number;
    style: number;
    speed: number;
  }): Promise<ArrayBuffer> {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: this.model,
            voice_settings: settings
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error("Error in speakText:", error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const elevenLabsService = new ElevenLabsService();