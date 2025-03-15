import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, Plus } from "lucide-react";

export default function SubscriptionSettings() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold mb-8">Abonnement</h1>

      <Card>
        <CardHeader>
          <CardTitle>Guthaben & Lizenz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">€50,00</div>
                <p className="text-sm text-muted-foreground">Aktuelles Guthaben</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">€150,00</div>
                <p className="text-sm text-muted-foreground">Genutztes Guthaben</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Button className="w-full h-full" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Guthaben aufladen
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Lizenzschlüssel</h3>
            <div className="flex gap-4">
              <Input placeholder="XXXX-XXXX-XXXX-XXXX" />
              <Button>Aktivieren</Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Zahlungsmethode</h3>
            <Button variant="outline" className="w-full justify-start">
              <CreditCard className="mr-2 h-4 w-4" />
              Zahlungsmethode hinzufügen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
