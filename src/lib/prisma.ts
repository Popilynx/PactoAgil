import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

/**
 * Singleton do Prisma Client com Driver Adapter (pg).
 * Esta configuração é ideal para ambientes Serverless/Edge do Next.js 15,
 * pois utiliza o engine WASM (Rust-free) e evita problemas com binários nativos.
 */

const prismaClientSingleton = () => {
  // Lidar com o carregamento dinâmico Node (Hostinger/Passenger) ou ambiente dev Vite (Astro)
  const isNode = typeof process !== 'undefined' && process.env;
  const connectionString = (isNode ? process.env.DATABASE_URL : import.meta.env.DATABASE_URL);

  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

  // Configuração do Pool do Postgres
  // Utilizar connectionString diretamente evita problemas de parsing e suporta parâmetros como ?pgbouncer=true
  const pool = new pg.Pool({
    connectionString,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  // Handler de erros do pool para evitar crash em caso de falha de conexão
  pool.on('error', (err) => {
    console.error('[Prisma Pool] Erro inesperado no pool de conexões:', err.message);
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  });
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

// Persistência da instância para gerenciar hot-reload em desenvolvimento
const client = globalThis.prisma ?? prismaClientSingleton();

if (!import.meta.env.PROD) {
  globalThis.prisma = client;
}

/**
 * Proxied Prisma Client para segurança durante o build.
 */
const prisma = new Proxy(client, {
  get: (_target, prop) => {
    if (prop === 'then') return undefined;
    return (client as any)[prop];
  }
});

export default prisma;