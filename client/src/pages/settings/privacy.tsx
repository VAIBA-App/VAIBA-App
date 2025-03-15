import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacySettings() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold mb-8">Datenschutz & Nutzungsbedingungen</h1>

      <Card>
        <CardHeader>
          <CardTitle>Datenschutzerklärung</CardTitle>
        </CardHeader>
        <CardContent className="prose">
          <h2>Datenschutz</h2>
          <p>
            Wir legen großen Wert auf den Schutz Ihrer persönlichen Daten. Diese
            Datenschutzerklärung informiert Sie über die Art, den Umfang und die
            Zwecke der Erhebung und Verwendung personenbezogener Daten durch VAIBA.
          </p>

          <h3>Datenerhebung und -verwendung</h3>
          <p>
            Die von Ihnen bereitgestellten Daten werden ausschließlich für die
            Bereitstellung unserer Dienstleistungen verwendet. Ihre Daten werden
            nicht an Dritte weitergegeben, es sei denn, dies ist für die
            Erbringung der Dienstleistung erforderlich.
          </p>

          <h2>Nutzungsbedingungen</h2>
          <p>
            Die Nutzung von VAIBA unterliegt den folgenden Bedingungen. Durch die
            Nutzung unserer Dienste erklären Sie sich mit diesen
            Nutzungsbedingungen einverstanden.
          </p>

          <h3>Lizenzvereinbarung</h3>
          <p>
            Die Nutzung der Software ist an den Erwerb einer gültigen Lizenz
            gebunden. Die Lizenz ist nicht übertragbar und gilt nur für den
            registrierten Nutzer.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
