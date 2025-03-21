import OpenAI from "openai";
import { db } from "@db";
import { users, profiles, customers, calls } from "@db/schema";
import { eq } from "drizzle-orm";
import { marked } from 'marked';

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const CHAT_MODEL = "gpt-4o";

export type SentimentAnalysis = {
  rating: number;
  confidence: number;
};

// Configure marked options
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert line breaks to <br>
  headerIds: false, // Don't add IDs to headers
  mangle: false, // Don't mangle email addresses
});

// Helper function to convert Markdown to HTML
function convertToHTML(markdown: string): string {
  try {
    return marked.parse(markdown);
  } catch (error) {
    console.error('Error converting markdown to HTML:', error);
    return markdown; // Return original text if conversion fails
  }
}

// Helper function to get user context from database with timeout
async function getUserContext(userId: number) {
  try {
    console.log('Starting context fetch for user:', userId);
    const startTime = Date.now();

    // If RAG is disabled, return default context
    if (process.env.DISABLE_RAG === 'true') {
      console.log('RAG disabled, using default context');
      return {
        user: null,
        activeProfile: null,
        recentActivity: {
          calls: [],
          customers: []
        }
      };
    }

    // Set timeout for database queries
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 5000)
    );

    // Run queries concurrently with timeout
    const [userResult, profileResult, callsResult, customersResult] = await Promise.all([
      Promise.race([
        db.select().from(users).where(eq(users.id, userId)).limit(1),
        timeout
      ]),
      Promise.race([
        db.select().from(profiles).where(eq(profiles.isActive, true)).limit(1),
        timeout
      ]),
      Promise.race([
        db.select().from(calls).where(eq(calls.customerId, userId)).limit(5),
        timeout
      ]),
      Promise.race([
        db.select().from(customers).limit(5),
        timeout
      ])
    ]).catch(error => {
      console.error('Error fetching context:', error);
      return [[], [], [], []];
    });

    const timeTaken = Date.now() - startTime;
    console.log(`Context fetch completed in ${timeTaken}ms`);

    return {
      user: userResult[0] || null,
      activeProfile: profileResult[0] || null,
      recentActivity: {
        calls: callsResult || [],
        customers: customersResult || []
      }
    };
  } catch (error) {
    console.error('Error in getUserContext:', error);
    return {
      user: null,
      activeProfile: null,
      recentActivity: {
        calls: [],
        customers: []
      }
    };
  }
}

async function formatContextPrompt(context: any) {
  if (!context || !context.activeProfile) {
    return `
Du bist VAIBA, ein professioneller KI-Assistent für Geschäftskommunikation.
Deine Aufgabe ist es, klare, professionelle und hilfreiche Antworten zu geben.

Formatierungsrichtlinien:
- Strukturiere deine Antworten IMMER in deutliche Absätze mit Markdown
- Nutze **fette** und *kursive* Schrift für Hervorhebungen
- Füge eine Leerzeile zwischen Absätzen ein
- Beginne jeden neuen Gedanken in einem neuen Absatz
- Verwende Aufzählungspunkte für Listen und wichtige Punkte
- Nutze passende Emojis (max. 1-2 pro Antwort) für einen freundlichen Ton
- Setze Trennzeichen (---) zwischen verschiedenen Themenbereichen

Beispiel für die gewünschte Formatierung:
🤝 **Guten Tag!** Ich freue mich, dass Sie sich an mich wenden.

Zu Ihrer Frage bezüglich der *Verkaufsstrategie* möchte ich Ihnen folgende Punkte erläutern:

- **Erstens:** Analysieren Sie Ihre Zielgruppe genau
- **Zweitens:** Entwickeln Sie maßgeschneiderte Lösungen
- **Drittens:** Bleiben Sie im regelmäßigen Kontakt

Lassen Sie uns diese Punkte im Detail durchgehen.

---

Deine Kernkompetenzen:
📊 **Vertrieb und Kundengewinnung**
📱 **Marketing und Social Media**
📈 **Geschäftsanalyse und Strategie**
🛠️ **Produktentwicklung**
🤝 **Kundenbeziehungsmanagement**

Halte deine Sprache:
- Professionell aber freundlich
- Klar und präzise
- Gut strukturiert
- Leicht verständlich

Wenn du zusätzliche Informationen benötigst, frage gezielt nach.
`;
  }

  const { activeProfile, recentActivity } = context;

  return `
Du bist ${activeProfile.name}, ${activeProfile.gender === 'weiblich' ? 'eine' : 'ein'} ${activeProfile.position} bei ${activeProfile.company}.

**Dein Profil:**
👤 Name: ${activeProfile.name} ${activeProfile.lastName || ''}
📍 Standort: ${activeProfile.location}
🎓 Ausbildung: ${activeProfile.education}
🌍 Sprachen: ${activeProfile.languages?.join(', ') || 'Deutsch'}

Formatierungsrichtlinien:
- Strukturiere deine Antworten IMMER in deutliche Absätze mit Markdown
- Nutze **fette** und *kursive* Schrift für Hervorhebungen
- Füge eine Leerzeile zwischen Absätzen ein
- Beginne jeden neuen Gedanken in einem neuen Absatz
- Verwende Aufzählungspunkte für Listen und wichtige Punkte
- Nutze passende Emojis (max. 1-2 pro Antwort) für einen freundlichen Ton
- Setze Trennzeichen (---) zwischen verschiedenen Themenbereichen

${recentActivity.calls.length > 0 ? `
**Kontext der letzten Aktivitäten:**
${recentActivity.calls.map(call => 
  `- Gespräch am ${new Date(call.createdAt).toLocaleDateString()}: ${call.status}`
).join('\n')}

` : ''}

${recentActivity.customers.length > 0 ? `
**Kunden im System:**
${recentActivity.customers.map(customer => 
  `- ${customer.firstName} ${customer.lastName} von ${customer.company}`
).join('\n')}

` : ''}

**Deine Kernkompetenzen:**
📊 **Vertrieb und Kundengewinnung**
📱 **Marketing und Social Media**
📈 **Geschäftsanalyse und Strategie**
🛠️ **Produktentwicklung**
🤝 **Kundenbeziehungsmanagement**

Halte deine Sprache:
- Professionell aber freundlich
- Klar und präzise
- Gut strukturiert
- Leicht verständlich

Wenn du zusätzliche Informationen benötigst, frage gezielt nach.
`;
}

export async function generateChatResponse(message: string, userId: number) {
  try {
    console.log('Starting chat generation for user:', userId);
    const startTime = Date.now();

    // Get user context from database with performance logging
    const context = await getUserContext(userId);
    console.log(`Context fetch took ${Date.now() - startTime}ms`);

    // Format the system prompt with the context
    const systemPrompt = await formatContextPrompt(context);
    console.log('System prompt formatted, generating response...');

    // Generate response with OpenAI
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
    });

    // Convert the Markdown response to HTML
    const markdownResponse = completion.choices[0].message.content || '';
    const htmlResponse = convertToHTML(markdownResponse);

    console.log(`Total chat generation took ${Date.now() - startTime}ms`);
    return htmlResponse;
  } catch (error) {
    console.error('Chat generation failed:', error);
    throw error;
  }
}

/**
 * Generiert einen optimierten Prompt für die Website-Erstellung basierend auf Unternehmensinformationen
 * 
 * @param companyInfo - Unternehmensinformationen wie Name, Branche, etc.
 * @param designDescription - Nutzerangabe zur gewünschten Website-Gestaltung
 * @returns Formatierter Prompt für die OpenAI API
 */
export function generateWebsitePrompt(
  companyInfo: any, 
  designDescription: string
): string {
  // Bestimme die verfügbaren Services als String
  const services = [];
  if (companyInfo?.online_service) services.push('Online-Dienstleistungen');
  if (companyInfo?.local_service) services.push('Lokale Dienstleistungen');
  if (companyInfo?.online_product) services.push('Online-Produkte');
  if (companyInfo?.local_product) services.push('Lokale Produkte');
  
  // Erstellen des angereicherten Prompts mit Unternehmensdaten
  if (companyInfo) {
    return `
Als erfahrener Webentwickler, erstelle bitte eine professionelle HTML/CSS-Website für das folgende Unternehmen:

UNTERNEHMENSDATEN:
- Name: ${companyInfo.name || 'Unbekannt'}
- Branche: ${companyInfo.industry || 'Unbekannt'}
- Angebotene Leistungen: ${services.length > 0 ? services.join(', ') : 'Diverse Leistungen'}
- Website: ${companyInfo.website || 'N/A'}
- E-Mail: ${companyInfo.email || 'kontakt@example.com'}
- Adresse: ${companyInfo.street || ''}, ${companyInfo.zip_code || ''} ${companyInfo.city || ''}, ${companyInfo.country || ''}

NUTZERBESCHREIBUNG:
"${designDescription}"

Befolge diese Richtlinien:
1. Erstelle eine MODERNE, responsive Website mit Flexbox/Grid-Layout für optimale Darstellung
2. Integriere ansprechende Google Fonts (mit @import oder font-face) für eine elegante Typografie
3. Verwende modernen CSS-Stil inspiriert von Tailwind oder Bootstrap (in-line)
4. Integriere die echten Unternehmensdaten in die Website
5. Füge ein attraktives Hintergrundbild im Header-Bereich hinzu (als SVG oder Data-URL)
6. Alle Navigationspunkte und Links müssen NUR mit Hashtags arbeiten (#service, #about, etc.) und zu Ankerpunkten auf derselben Seite führen
7. Der Code muss valides HTML5 und CSS sein mit einer responsive, visuell ansprechenden Gestaltung
8. Implementiere folgende interaktive Elemente:
   - Professioneller Bilder-Slider mit Übergangseffekten
   - Animierte Scroll-Effekte und Hover-Zustände für alle Buttons
   - Dynamischer Textwechsel für Headlines und Slogans
   - Moderne Animationen (Fade-in, Slide-in) für ein premium Erscheinungsbild
9. Alle Navigationspunkte müssen zu entsprechenden Abschnitten auf derselben Seite führen (#services, #about, #contact)
10. Gib NUR den HTML-Code zurück, ohne Erklärungen oder Kommentare außerhalb des Codes

Erstelle eine vollständige, funktionsfähige Website mit einer professionellen Struktur und gutem Design, die speziell auf die ${companyInfo.industry || 'angegebene'} Branche zugeschnitten ist und moderne Web-Standards nutzt.
`;
  } else {
    // Standardprompt ohne Unternehmensdaten
    return `
Als erfahrener Webentwickler, erstelle bitte eine einfache aber professionelle HTML/CSS-Website basierend auf dieser Beschreibung:

"${designDescription}"

Befolge diese Richtlinien:
1. Erstelle eine MODERNE, responsive Website mit Flexbox/Grid-Layout für optimale Darstellung
2. Integriere ansprechende Google Fonts (mit @import oder font-face) für eine elegante Typografie
3. Verwende modernen CSS-Stil inspiriert von Tailwind oder Bootstrap (in-line)
4. Füge ein attraktives Hintergrundbild im Header-Bereich hinzu (als SVG oder Data-URL)
5. Alle Navigationspunkte und Links müssen NUR mit Hashtags arbeiten (#service, #about, etc.) und zu Ankerpunkten auf derselben Seite führen
6. Der Code muss valides HTML5 und CSS sein mit einer responsive, visuell ansprechenden Gestaltung
7. Implementiere folgende interaktive Elemente:
   - Professioneller Bilder-Slider mit Übergangseffekten
   - Animierte Scroll-Effekte und Hover-Zustände für alle Buttons
   - Dynamischer Textwechsel für Headlines und Slogans
   - Moderne Animationen (Fade-in, Slide-in) für ein premium Erscheinungsbild
8. Alle Navigationspunkte müssen zu entsprechenden Abschnitten auf derselben Seite führen (#services, #about, #contact)
9. Gib NUR den HTML-Code zurück, ohne Erklärungen oder Kommentare außerhalb des Codes

Erstelle eine vollständige, funktionsfähige Website mit einer professionellen Struktur und gutem Design, die moderne Web-Standards nutzt.
`;
  }
}

// Export the OpenAI instance for use in other components
export { openai };