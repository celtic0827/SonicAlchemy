import { GoogleGenAI } from "@google/genai";

// Initialize Gemini client only if API key is present to avoid immediate crash on load if missing
const getAiClient = () => {
  if (!process.env.API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateRefinedPrompt = async (
  basePrompt: string, 
  mood: string = 'creative'
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) {
    return `[AI Disabled] ${basePrompt}`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert AI music prompt engineer. 
      I have a collection of keywords/tags: "${basePrompt}".
      Please rewrite these into a cohesive, high-quality text-to-music prompt describing a song with these characteristics. 
      Keep it under 50 words. Focus on the ${mood} mood. 
      Return ONLY the prompt string, no markdown.`,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return basePrompt; // Fallback to original
  }
};

export const extractTagsFromPrompt = async (prompt: string): Promise<string[]> => {
  const ai = getAiClient();
  if (!ai) {
    // Fallback: simple split
    return prompt.split(/[,|\n]/).map(s => s.trim()).filter(s => s.length > 0);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Extract the top 5-10 most relevant musical style/mood tags from this description: "${prompt}".
      Return them as a comma-separated list. Example output: "Jazz, Piano, Melancholic".`,
    });
    return response.text.split(',').map(s => s.trim());
  } catch (error) {
    console.error("Gemini API Error:", error);
    return prompt.split(/[,|\n]/).map(s => s.trim()).filter(s => s.length > 0);
  }
};
