import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!apiKey) {
    console.warn("GOOGLE_AI_API_KEY não configurada. Usando vetor fake para testes.");
    return new Array(768).fill(0); // Dimensão padrão do modelo de embedding do Gemini
  }

  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Erro ao gerar embedding:", error);
    throw error;
  }
}
