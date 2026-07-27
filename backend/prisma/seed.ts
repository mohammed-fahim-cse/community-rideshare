import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const community = await prisma.community.upsert({
    where: { inviteCode: 'DEMO1234' },
    update: {},
    create: {
      name: 'Demo Neighborhood',
      inviteCode: 'DEMO1234',
      autoApprove: true,
      matchingRadiusKm: 5,
    },
  });
  console.log('Seeded community:', community);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
