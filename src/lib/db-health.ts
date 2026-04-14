import prisma from './prisma';

/**
 * Verifica a saúde da conexão com o banco de dados.
 * Retorna true se conectado, false caso contrário.
 */
export async function checkDbHealth(): Promise<{ healthy: boolean; error?: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { healthy: true };
  } catch (err) {
    console.error('[DB Health Check] Falha na conexão:', err);
    return {
      healthy: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido',
    };
  }
}

/**
 * Testa a conexão antes de executar queries críticas.
 * Útil para rotas de API que dependem do banco.
 */
export async function withDbHealthCheck<T>(
  operation: () => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T> {
  const health = await checkDbHealth();

  if (!health.healthy) {
    console.error('[DB Health] Banco indisponível:', health.error);
    if (fallback) {
      return fallback();
    }
    throw new Error(`Database connection failed: ${health.error}`);
  }

  return operation();
}
