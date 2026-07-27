import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const phone = process.argv[2];
  if (!phone) {
    console.error('Usage: npm run prisma:make-admin -w backend -- <phone>');
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.update({
    where: { phone },
    data: { role: 'ADMIN' },
  });
  console.log(`${user.phone} is now an admin of community ${user.communityId}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
