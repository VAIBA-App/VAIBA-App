import OpenAI from "openai";
import { db } from "@db";
import { users, profiles, customers, calls } from "@db/schema";
import { eq } from "drizzle-orm";

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

// Helper function to get user context from database with timeout
async function getUserContext(userId: number) {
  try {
    console.log('Starting context fetch for user:', userId);
    const startTime = Date.now();

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
    // Return a safe default context
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

export async function analyzeSentiment(text: string): Promise<SentimentAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        {
          role: "system",
          content: "Analyze the sentiment of the text and provide a rating from 1-5 stars and a confidence score between 0 and 1. Output in JSON format: { rating: number, confidence: number }",
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    const result = JSON.parse(content);
    return {
      rating: Math.max(1, Math.min(5, Math.round(result.rating))),
      confidence: Math.max(0, Math.min(1, result.confidence)),
    };
  } catch (error) {
    console.error("Sentiment analysis failed:", error);
    return { rating: 3, confidence: 0 };
  }
}

async function formatContextPrompt(context: any) {
  if (!context || !context.activeProfile) {
    return `
Du bist VAIBA, ein professioneller KI-Assistent für Geschäftskommunikation.
Deine Aufgabe ist es, klare, professionelle und hilfreiche Antworten zu geben. Du unterstützt in:
- Vertrieb und Kundengewinnung
- Marketing und Social Media
- Geschäftsanalyse und Strategie
- Produktentwicklung
- Kundenbeziehungsmanagement

Wenn du zusätzliche Informationen benötigst, frage gezielt nach.
`;
  }

  const { activeProfile, recentActivity } = context;

  return `
Du bist ${activeProfile.name}, ${activeProfile.gender === 'weiblich' ? 'eine' : 'ein'} ${activeProfile.position} bei ${activeProfile.company}.

Dein Profil:
- Alter: ${activeProfile.age}
- Herkunft: ${activeProfile.origin}
- Standort: ${activeProfile.location}
- Ausbildung: ${activeProfile.education}
- Sprachen: ${activeProfile.languages?.join(', ') || 'Deutsch'}

${recentActivity.calls.length > 0 ? `
Kontext der letzten Aktivitäten:
${recentActivity.calls.map(call => 
  `- Gespräch am ${new Date(call.createdAt).toLocaleDateString()}: ${call.status}`
).join('\n')}
` : ''}

${recentActivity.customers.length > 0 ? `
Kunden im System:
${recentActivity.customers.map(customer => 
  `- ${customer.firstName} ${customer.lastName} von ${customer.company}`
).join('\n')}
` : ''}

Deine Aufgabe ist es, klare, professionelle und hilfreiche Antworten zu geben. Du unterstützt in:
- Vertrieb und Kundengewinnung
- Marketing und Social Media
- Geschäftsanalyse und Strategie
- Produktentwicklung
- Kundenbeziehungsmanagement

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

    console.log(`Total chat generation took ${Date.now() - startTime}ms`);
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Chat generation failed:', error);
    throw error;
  }
}