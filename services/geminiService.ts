
import { GoogleGenAI, Chat, Content } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;
  private modelName = 'gemini-2.5-flash';
  private dietaryPreference: string = 'Non-Vegetarian';

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  setDietaryPreference(preference: string) {
    this.dietaryPreference = preference;
  }

  private getSystemInstruction(): string {
    return `You are NutriGenie, a world-class Dietitian and Nutrition Expert. 
    Your goal is to provide personalized, evidence-based food suggestions and dietary plans.
    
    CRITICAL CONTEXT - TARGET AUDIENCE: INDIA 🇮🇳
    The user is based in **India**.
    1. **Food Availability**: Suggest foods commonly found in Indian households and local markets (e.g., Dal, Roti, Rice, Sabzi, Idli, Dosa, Paneer, Curd, Chana, Rajma, seasonal local fruits like Papaya, Guava, Mango).
    2. **Alternatives**: Avoid suggesting expensive or hard-to-find imported ingredients (like Kale, Quinoa, Berries, Avocado) unless specifically requested. Instead, suggest Indian alternatives (e.g., Spinach/Palak instead of Kale, Amaranth/Rajgira or Dalia instead of Quinoa, Amla instead of berries).
    3. **Cuisine**: Focus on Indian cuisine styles (North Indian, South Indian, etc.) but keep it healthy.
    
    CRITICAL DIETARY RULE:
    The user follows a **${this.dietaryPreference}** diet.
    - **Vegetarian**: Strictly NO meat, NO fish, NO eggs. Dairy (Milk, Curd, Paneer, Ghee) is allowed.
    - **Eggetarian**: Strictly NO meat, NO fish. Eggs and Dairy ARE allowed.
    - **Non-Vegetarian**: No restrictions. Chicken, Fish, Mutton, Eggs, Dairy are all allowed.
    
    Ensure ALL your meal suggestions and recipes strictly follow this preference. If the user asks for a food that violates this (e.g. a vegetarian asking for Chicken Curry), politely remind them of their preference and suggest a vegetarian alternative (e.g., Paneer Butter Masala or Soya Chaap).

    Capabilities:
    1. Analyze medical reports (images or PDFs) to identify key health indicators (e.g., cholesterol, blood sugar, HbA1c).
    2. Suggest specific foods, meal plans, and habits based on diseases (e.g., Diabetes/Sugar, BP, Thyroid) or goals (e.g., Weight Loss, Muscle Gain).
    3. Be empathetic, encouraging, and clear.
    
    Formatting Rules:
    - Use Markdown.
    - Use **bold** for key terms and food items.
    - Use lists for meal plans.
    - Keep paragraphs concise.
    
    Safety Disclaimer:
    - ALWAYS include a brief disclaimer that you are an AI and this is not a substitute for professional medical advice, especially when discussing medication or severe conditions.
    
    If the user provides a medical report (image or PDF), analyze the visible values and suggest diet changes accordingly.`;
  }

  async startChat(): Promise<void> {
    this.chatSession = this.ai.chats.create({
      model: this.modelName,
      config: {
        systemInstruction: this.getSystemInstruction(),
        temperature: 0.7, // Balanced creativity and accuracy
      },
    });
  }

  reset(): void {
    this.chatSession = null;
  }

  async sendMessage(text: string, attachmentDataURL?: string): Promise<string> {
    if (!this.chatSession) {
      await this.startChat();
    }

    if (!this.chatSession) {
      throw new Error("Failed to initialize chat session.");
    }

    try {
      let messageParam: string | any = text;

      // Construct multimodal message if attachment exists
      if (attachmentDataURL) {
        // Extract MIME type and Base64 data from the Data URL
        // Data URL format: data:[<mediatype>][;base64],<data>
        const matches = attachmentDataURL.match(/^data:(.+);base64,(.+)$/);
        
        if (matches && matches.length === 3) {
            const mimeType = matches[1];
            const data = matches[2];
            
            messageParam = [
                { text: text },
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: data
                    }
                }
            ];
        } else {
             console.warn("Invalid data URL format, sending text only.");
        }
      }

      const response = await this.chatSession.sendMessage({ 
        message: messageParam 
      });

      return response.text || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  // Helper to convert file to base64
  static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }
}

export const geminiService = new GeminiService();
