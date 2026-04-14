import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;
  
  return new PrismaClient({
    datasources: {
      db: {
        url: connectionString
      }
    },
    log: ['error', 'warn'],
  });
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const client = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = client;
}

const prisma = new Proxy(client, {
  get(target, prop) {
    if (prop === 'then') return undefined;
    
    const value = target[prop];
    
    if (typeof value === 'function') {
      return async (...args: any[]) => {
        try {
          return await value.apply(target, args);
        } catch (error: any) {
          console.error('[Prisma Error]', error.message);
          if (process.env.NODE_ENV === 'production') {
            console.error('[Prisma] Check DATABASE_URL and database connectivity');
          }
          throw error;
        }
      };
    }
    
    return value;
  }
});

export default prisma;
