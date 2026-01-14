import { prisma } from "./prisma";

export async function checkCredits(userId: string, amount: number = 1) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  return (user?.credits ?? 0) >= amount;
}

export async function deductCredits(userId: string, amount: number = 1, description?: string, relatedId?: string) {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user || user.credits < amount) {
      throw new Error("Insufficient credits");
    }

    const newBalance = user.credits - amount;

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: amount } },
    });

    await tx.creditTransaction.create({
      data: {
        userId,
        type: "consume",
        amount: -amount,
        balance: newBalance,
        description,
        relatedId,
      },
    });

    return updatedUser;
  });
}

export async function addCredits(
  userId: string,
  amount: number,
  type: "recharge" | "gift" | "refund" = "recharge",
  description?: string,
  relatedId?: string
) {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const newBalance = user.credits + amount;

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
    });

    await tx.creditTransaction.create({
      data: {
        userId,
        type,
        amount,
        balance: newBalance,
        description,
        relatedId,
      },
    });

    return updatedUser;
  });
}

export async function getTransactionHistory(userId: string, limit: number = 20, offset: number = 0) {
  return await prisma.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

export async function getUserCredits(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });
  return user?.credits ?? 0;
}
