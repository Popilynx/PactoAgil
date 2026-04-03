import prisma from '@/lib/prisma';

/**
 * Interface para uma cláusula com vetor
 */
export interface ClauseWithEmbedding {
  id: string;
  content: string;
  metadata: any;
  similarity?: number;
}

/**
 * Busca por cláusulas similares no Supabase Vector
 * NOTA: Esta função exige que a extensão 'vector' e a função 'match_clausulas' 
 * estejam habilitadas no banco de dados.
 */
export async function searchSimilarClauses(
  embedding: number[],
  matchThreshold = 0.5,
  matchCount = 5
): Promise<ClauseWithEmbedding[]> {
  try {
    // Chamada RPC via Prisma para a função de busca vetorial do Supabase
    // O comando SQL bruto é necessário pois o Prisma ainda não suporta vetores nativamente
    const result = await prisma.$queryRawUnsafe<ClauseWithEmbedding[]>(
      `SELECT * FROM match_clausulas($1, $2, $3)`,
      `[${embedding.join(',')}]`,
      matchThreshold,
      matchCount
    );

    return result || [];
  } catch (error) {
    console.error("Erro na busca vetorial:", error);
    return [];
  }
}

/**
 * Salva uma nova cláusula com seu respectivo embedding
 */
export async function storeClause(
  content: string,
  embedding: number[],
  metadata: any
) {
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO clausulas (content, embedding, metadata) VALUES ($1, $2, $3)`,
      content,
      `[${embedding.join(',')}]`,
      JSON.stringify(metadata)
    );
  } catch (error) {
    console.error("Erro ao salvar cláusula:", error);
    throw error;
  }
}
