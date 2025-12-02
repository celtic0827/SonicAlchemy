import { GoogleGenAI } from "@google/genai";

export type AlchemyMode = 'stabilize' | 'synthesize' | 'mutate';

// Initialize Gemini client only if API key is present
const getAiClient = () => {
  if (!process.env.API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * The Alchemical Transmutation Process
 * Combines "Base Matter" (Common Tags) with "Volatile Matter" (Random/Unique Tags)
 * to generate a refined, high-quality music prompt.
 */
export const generateRefinedPrompt = async (
  commonTags: string[],
  uniqueTags: string[],
  mode: AlchemyMode = 'synthesize'
): Promise<string> => {
  const ai = getAiClient();
  const fallback = [...commonTags, ...uniqueTags].join(', '); 
  
  // Fallback if no API key or AI
  if (!ai) {
    return `[AI Disabled] (${mode}) Combined: ${fallback}`;
  }

  try {
    const ingredients = [
        ...commonTags.map(t => `${t} (Core Style)`),
        ...uniqueTags.map(t => `${t} (Volatile Element)`)
    ].join(', ');

    let modeInstruction = "";
    if (mode === 'stabilize') {
        modeInstruction = "MODE: STABILIZE. Prioritize coherence, structure, and standard genre conventions. The output should be predictable and polished. Do not let Volatile Elements overpower the Core Style.";
    } else if (mode === 'mutate') {
        modeInstruction = "MODE: MUTATE. Prioritize creativity, chaos, and experimental fusion. Allow Volatile Elements to warp the Core Style. The output should be unexpected, avant-garde, or complex.";
    } else {
        modeInstruction = "MODE: SYNTHESIZE. Create a perfect balance between the Core Style and Volatile Elements. The output should be fresh but musically cohesive.";
    }

    const systemInstruction = `
      You are a Master Sound Alchemist and Expert Music Producer.
      Your task is to synthesize a new "Golden Prompt" for an AI Music Generator (like Suno, Udio, or Stable Audio) based on provided ingredients.
      
      RULES:
      1. Analyze the input ingredients.
      2. ${modeInstruction}
      3. Eliminate logical contradictions.
      4. Enhance the prompt with professional audio keywords (e.g., "High fidelity", "Wide stereo", "Punchy bass") where appropriate.
      5. Keep the output under 60 words.
      6. Return ONLY the raw prompt string. Do not include "Here is your prompt" or quotes.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
        temperature: mode === 'mutate' ? 0.9 : (mode === 'stabilize' ? 0.5 : 0.7),
      },
      contents: `Transmute these ingredients into a song description: ${ingredients}`,
    });

    const text = response.text;
    if (!text) {
        console.warn("Gemini API returned empty text. Using fallback.");
        return fallback;
    }

    return text.trim();
  } catch (error) {
    // This catches XHR errors (network blocks) and other API issues
    console.warn("Gemini API Alchemy Warning (using fallback):", error);
    return fallback;
  }
};

export const extractTagsFromPrompt = async (prompt: string): Promise<string[]> => {
  const ai = getAiClient();
  // Simple fallback logic: split by commas or newlines
  const simpleExtract = (text: string) => text.split(/[,|\n]/).map(s => s.trim()).filter(s => s.length > 0);

  if (!ai) {
    return simpleExtract(prompt);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Extract the top 5-8 most relevant musical style, genre, mood, or instrument tags from this description: "${prompt}".
      Return them as a comma-separated list. No numbering. Example output: "Jazz, Piano, Melancholic".`,
    });
    
    const text = response.text;
    if (!text) throw new Error("No text generated");

    return text.split(',').map(s => s.trim()).filter(s => s.length > 0);
  } catch (error) {
    console.warn("Gemini API Extraction Warning (using simple split):", error);
    return simpleExtract(prompt);
  }
};