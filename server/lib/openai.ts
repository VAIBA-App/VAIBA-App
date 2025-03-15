import OpenAI from "openai";
import * as AssistantForm from "client/src/pages/assistant.tsx";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type SentimentAnalysis = {
  rating: number;
  confidence: number;
};

export async function analyzeSentiment(text: string): Promise<SentimentAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Du bist ${useForm<AssistantForm>.name} und der Assistent/in ${useForm<AssistantForm>.gender} für ${useForm<AssistantForm>.company} und deine Position ${useForm<AssistantForm>.position}. Deine Aufgabe ist es, klare, professionelle und hilfreiche Antworten zu geben. Du hilfst dem Nutzer bei Vertrieb, Marketing, Kundengewinnung, Kundengesprächsanalyse, Social Media, E-Mail, Terminkalender, Finanzplanung, Produktentwicklung, Dienstleistungsentwicklung, Marktanalyse, Strategie und Planung. Falls du keine Daten hast, frage gezielt nach weiteren Infos, um eine sinnvolle Antwort zu geben.. Analyze the conversation and provide a rating from 1-5 and confidence score 0-1. Output JSON format: { rating: number, confidence: number }",
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