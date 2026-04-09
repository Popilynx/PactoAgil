import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const emails = ['contato@cursoecertificado.com.br', 'renato@starwars1.com.br'];
  const users = await prisma.perfil.findMany({
    where: {
      email: { in: emails }
    },
    select: {
      email: true,
      userId: true
    }
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
