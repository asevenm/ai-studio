import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 创建默认的充值套餐
  const packages = [
    { name: "体验包", credits: 50, price: 9.9, sortOrder: 1 },
    { name: "基础包", credits: 200, price: 29.9, sortOrder: 2 },
    { name: "标准包", credits: 500, price: 59.9, sortOrder: 3 },
    { name: "专业包", credits: 1200, price: 99.9, sortOrder: 4 },
    { name: "企业包", credits: 5000, price: 299.9, sortOrder: 5 },
  ];

  console.log("Seeding credit packages...");

  for (const pkg of packages) {
    await prisma.creditPackage.upsert({
      where: { id: pkg.name },
      update: pkg,
      create: pkg,
    });
    console.log(`Created package: ${pkg.name}`);
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
