
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async getMissionBriefing(wave: number, score: number): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a short, intense tactical mission briefing for a sci-fi fighter pilot entering Wave ${wave}. Current Score: ${score}. Keep it under 150 characters. Use military jargon.`,
        config: {
          temperature: 0.8,
          maxOutputTokens: 60,
        }
      });
      return response.text || "Engage all hostile signatures. Good luck, Commander.";
    } catch (error) {
      console.error("Gemini briefing error:", error);
      return "Hostile signatures detected. Sweep and clear current sector.";
    }
  }
}

export const gemini = new GeminiService();
