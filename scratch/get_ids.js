import prisma from './src/lib/prisma.js';

async function main() {
  const emails = ['contato@cursoecertificado.com.br', 'renato@starwars1.com.br'];
  try {
    const users = await (prisma as any).perfil.findMany({
      where: {
        email: { in: emails }
      },
      select: {
        email: true,
        userId: true
      }
    });
    process.stdout.write(JSON.stringify(users, null, 2));
  } catch (e) {
    process.stderr.write(String(e));
  }
}

main().finally(() => process.exit());
