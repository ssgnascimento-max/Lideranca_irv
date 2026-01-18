
import { GoogleGenAI } from "@google/genai";

// Always use named parameter for apiKey and use process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePastorWord = async (theme: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Escreva uma mensagem pastoral inspiradora de aproximadamente 200 palavras sobre o tema: "${theme}". Use um tom acolhedor, bíblico e encorajador para a congregação.`,
    });
    // .text is a property on GenerateContentResponse
    return response.text || "Não foi possível gerar a mensagem no momento.";
  } catch (error) {
    console.error("Error generating pastor word:", error);
    return "Erro ao conectar com a sabedoria divina artificial. Tente novamente.";
  }
};

export const expandStudy = async (studyTitle: string, reference: string) => {
  try {
    const response = await ai.models.generateContent({
      // Using gemini-3-pro-preview for tasks requiring more structured reasoning and complex output
      model: 'gemini-3-pro-preview',
      contents: `Crie um roteiro de estudo bíblico para uma célula baseado no tema "${studyTitle}" e na referência "${reference}". O roteiro deve incluir: 1. Quebra-gelo, 2. Louvor sugerido, 3. Pergunta de reflexão, 4. Aplicação prática.`,
    });
    return response.text || "Não foi possível expandir o estudo.";
  } catch (error) {
    console.error("Error expanding study:", error);
    return "Erro ao expandir o estudo.";
  }
};
