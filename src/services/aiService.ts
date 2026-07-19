import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-flash-latest";

export const chatWithData = async (message: string, contextData?: string) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "dummy_key") {
      // DEMO MODE: Return a friendly fallback when no API key is configured
      return `I'm running in demo mode because the AI API key is not configured.
To enable real AI responses, add a valid GEMINI_API_KEY to your env configuration.

Your question was: "${message}"`;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Custom prompt matching StudyMate domain persona
    const prompt = `
      You are StudyMate AI, an expert personal study assistant.
      You help users understand study topics, structure roadmaps, and provide academic guidance.
      Keep your responses concise, professional, and helpful (under 150 words).
      ${contextData ? `\nHere is relevant context:\n${contextData}\n` : ""}
      User message: ${message}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    return `I encountered an issue: ${error?.message || "Unknown error"}.`;
  }
};
