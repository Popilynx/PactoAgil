import { GoogleGenerativeAI } from "@google/generative-ai";

const getGenAI = () => {
  const apiKey = process.env.GOOGLE_AI_API_KEY || "";
  return new GoogleGenerativeAI(apiKey);
};

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    console.warn("GOOGLE_AI_API_KEY não configurada. Usando vetor fake para testes.");
    return new Array(768).fill(0);
  }

  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Erro ao gerar embedding:", error);
    throw error;
  }
}
