import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, FileText, Video } from "lucide-react";

export default function HelpSettings() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold mb-8">Hilfe & Support</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Support kontaktieren</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <Mail className="mr-2 h-4 w-4" />
              E-Mail Support
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <MessageCircle className="mr-2 h-4 w-4" />
              Live Chat
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dokumentation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Benutzerhandbuch
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Video className="mr-2 h-4 w-4" />
              Video-Tutorials
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Häufig gestellte Fragen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Wie starte ich einen automatischen Anruf?</h3>
            <p className="text-sm text-muted-foreground">
              Navigieren Sie zum "Auto-Anrufe" Bereich und folgen Sie den Anweisungen
              auf dem Bildschirm.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Wie funktioniert Voice Cloning?</h3>
            <p className="text-sm text-muted-foreground">
              VAIBA bietet zwei Optionen: Instant Voice Cloning (IVC) für schnelle
              Ergebnisse und Professional Voice Cloning (PVC) für höchste Qualität.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Wie kann ich mein Guthaben aufladen?</h3>
            <p className="text-sm text-muted-foreground">
              Besuchen Sie die Abonnement-Einstellungen und wählen Sie "Guthaben
              aufladen".
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
