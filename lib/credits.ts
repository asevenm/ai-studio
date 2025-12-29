import { prisma } from "./prisma";

export async function checkCredits(userId: string, amount: number = 1) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  return (user?.credits ?? 0) >= amount;
}

export async function deductCredits(userId: string, amount: number = 1) {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user || user.credits < amount) {
      throw new Error("Insufficient credits");
    }

    return await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: amount } },
    });
  });
}
