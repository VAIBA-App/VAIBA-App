import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
  maxRetries: 3,
  timeout: 30000 // 30 seconds timeout
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
            "You are a sales call sentiment analyzer. Analyze the conversation and provide a rating from 1-5 and confidence score 0-1. Output JSON format: { rating: number, confidence: number }",
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.7
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
  } catch (error: any) {
    console.error("Sentiment analysis failed:", error);
    //More specific error handling could be added here based on error codes (429, 401, 500, etc.)
    if(error.response && error.response.status){
        let message = "An unknown error occurred";
        switch(error.response.status){
            case 429: message = "Too many requests. Please try again later."; break;
            case 401: message = "Unauthorized. Please check your API key."; break;
            case 500: message = "Internal server error. Please try again later."; break;
        }
        //Add toast notification here with message and 5000ms duration
        console.error(message);
        return { rating: 3, confidence: 0 };
    } else {
        console.error("Sentiment analysis failed:", error);
        return { rating: 3, confidence: 0 };
    }
  }
}

export async function generateCallSummary(transcript: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a sales call analyst. Summarize the key points and outcome of this conversation concisely.",
        },
        {
          role: "user",
          content: transcript,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    return content || "No summary available";
  } catch (error: any) {
    console.error("Summary generation failed:", error);
    //More specific error handling could be added here based on error codes (429, 401, 500, etc.)
    if(error.response && error.response.status){
        let message = "An unknown error occurred";
        switch(error.response.status){
            case 429: message = "Too many requests. Please try again later."; break;
            case 401: message = "Unauthorized. Please check your API key."; break;
            case 500: message = "Internal server error. Please try again later."; break;
        }
        //Add toast notification here with message and 5000ms duration
        console.error(message);
        return "Failed to generate summary";
    } else {
        console.error("Summary generation failed:", error);
        return "Failed to generate summary";
    }
  }
}

// Export the OpenAI instance for use in other components
export { openai };