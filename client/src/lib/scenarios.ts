import { z } from "zod";

export interface Scenario {
  id: string;
  title: string;
  description: string;
  customerProfile: {
    name: string;
    role: string;
    industry: string;
    pain_points: string[];
  };
  script: {
    intro: string;
    key_points: string[];
    potential_objections: string[];
    recommended_responses: string[];
  };
}

export const scenarios: Scenario[] = [
  {
    id: "software-demo",
    title: "Software Demo Anfrage",
    description: "Ein potenzieller Kunde interessiert sich für eine Software-Demo",
    customerProfile: {
      name: "Thomas Meyer",
      role: "IT-Manager",
      industry: "Fertigung",
      pain_points: [
        "Veraltete Legacy-Systeme",
        "Hohe Wartungskosten",
        "Ineffiziente Prozesse"
      ]
    },
    script: {
      intro: "Guten Tag, ich rufe an wegen Ihrer Anfrage zu einer Software-Demo. Haben Sie einen Moment Zeit?",
      key_points: [
        "Modernisierung der IT-Infrastruktur",
        "Kosteneinsparungen durch Automatisierung",
        "Nahtlose Integration mit bestehenden Systemen"
      ],
      potential_objections: [
        "Das Budget ist dieses Jahr bereits ausgeschöpft",
        "Wir haben bereits eine andere Lösung im Blick",
        "Der Implementierungsaufwand erscheint mir zu hoch"
      ],
      recommended_responses: [
        "Wir bieten flexible Zahlungsmodelle an, die sich auch über das nächste Geschäftsjahr verteilen lassen",
        "Unsere Lösung unterscheidet sich durch [Alleinstellungsmerkmale]. Lassen Sie uns die Vorteile im Detail besprechen",
        "Unser Implementierungsteam hat bereits viele erfolgreiche Migrationen durchgeführt. Der typische Zeitrahmen beträgt nur [Zeit]"
      ]
    }
  },
  {
    id: "consulting-service",
    title: "Beratungsdienstleistung",
    description: "Akquise eines Neukunden für Digitalisierungsberatung",
    customerProfile: {
      name: "Dr. Sandra Klein",
      role: "Geschäftsführerin",
      industry: "Gesundheitswesen",
      pain_points: [
        "Digitale Transformation notwendig",
        "Mitarbeiterwiderstände gegen Veränderung",
        "Datenschutzbedenken"
      ]
    },
    script: {
      intro: "Guten Tag Dr. Klein, ich bin Maria von TecSpec. Wir hatten uns letzte Woche auf der Healthcare Innovation Konferenz kurz ausgetauscht. Haben Sie einen Moment?",
      key_points: [
        "Erfahrung im Gesundheitssektor",
        "Change Management Expertise",
        "DSGVO-konforme Lösungen"
      ],
      potential_objections: [
        "Wir haben bereits interne Berater",
        "Der Zeitpunkt ist ungünstig",
        "Die Kosten sind zu hoch"
      ],
      recommended_responses: [
        "Externe Perspektive kann ihre internen Experten optimal ergänzen",
        "Gerade jetzt ist der richtige Zeitpunkt, um Wettbewerbsvorteile zu sichern",
        "Unsere Beratung amortisiert sich durch nachweisbare Effizienzsteigerungen"
      ]
    }
  }
];

// Schema validation
export const scenarioSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  customerProfile: z.object({
    name: z.string(),
    role: z.string(),
    industry: z.string(),
    pain_points: z.array(z.string())
  }),
  script: z.object({
    intro: z.string(),
    key_points: z.array(z.string()),
    potential_objections: z.array(z.string()),
    recommended_responses: z.array(z.string())
  })
});