import { GoogleGenAI } from "@google/genai";

class GeminiService {
    private genAI: GoogleGenAI;

    constructor() {
        // Access your API key as an environment variable (see "Set up your API key" above)
        this.genAI = new GoogleGenAI({});
    }

    async generateContent(prompt: string) {
        // For text-only input, use the gemini-pro model
        const response = await this.genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    }
}

export default new GeminiService();
