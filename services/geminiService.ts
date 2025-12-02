import { GoogleGenAI, Type } from "@google/genai";

export type AlchemyMode = 'stabilize' | 'synthesize' | 'mutate';

export interface TrackMetadata {
    tags: string[];
    colors: string[]; // [primary, secondary] hex codes
    emoji: string;
}

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

/**
 * Analyzes the prompt to extract:
 * 1. Musical Tags
 * 2. Visual Theme (Colors)
 * 3. Icon (Emoji)
 */
export const analyzeTrackMetadata = async (prompt: string): Promise<TrackMetadata> => {
  const ai = getAiClient();
  
  // Fallback
  const simpleExtract = (text: string): TrackMetadata => ({
      tags: text.split(/[,|\n]/).map(s => s.trim()).filter(s => s.length > 0).slice(0, 5),
      colors: ['#334155', '#475569'], // Slate default
      emoji: '🎵'
  });

  if (!ai) {
    return simpleExtract(prompt);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                colors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Two hex color codes representing the mood (e.g. Sad=#1e3a8a, Energetic=#ef4444)" },
                emoji: { type: Type.STRING, description: "A single emoji best representing the song theme" }
            }
        }
      },
      contents: `Analyze this music description: "${prompt}". 
      1. Extract top 5-8 musical tags (genre, mood, instrument).
      2. Select 2 hex colors that represent the mood/key (e.g. Dark/Minor -> Cool/Dark colors, Happy/Major -> Warm/Bright colors).
      3. Choose 1 single emoji that best fits the theme.`,
    });
    
    const text = response.text;
    if (!text) throw new Error("No text generated");

    const json = JSON.parse(text);
    return {
        tags: json.tags || [],
        colors: json.colors?.length >= 2 ? json.colors : ['#334155', '#475569'],
        emoji: json.emoji || '🎵'
    };

  } catch (error) {
    console.warn("Gemini API Extraction Warning (using simple split):", error);
    return simpleExtract(prompt);
  }
};