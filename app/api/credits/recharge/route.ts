import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { addCredits } from "@/lib/credits";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { packageId } = body;

    if (!packageId) {
      return NextResponse.json(
        { error: "Package ID is required" },
        { status: 400 }
      );
    }

    // Get the credit package
    const creditPackage = await prisma.creditPackage.findUnique({
      where: { id: packageId },
    });

    if (!creditPackage || !creditPackage.isActive) {
      return NextResponse.json(
        { error: "Invalid or inactive package" },
        { status: 400 }
      );
    }

    // TODO: Integrate actual payment gateway (Stripe, Alipay, WeChat Pay, etc.)
    // For now, we'll simulate a successful payment
    // In production, you would:
    // 1. Create a payment order
    // 2. Redirect to payment gateway
    // 3. Handle payment callback/webhook
    // 4. Only add credits after confirmed payment

    // Simulate payment success - add credits
    const updatedUser = await addCredits(
      userId,
      creditPackage.credits,
      "recharge",
      `充值 ${creditPackage.name}`,
      creditPackage.id
    );

    return NextResponse.json({
      success: true,
      credits: updatedUser.credits,
      message: `Successfully recharged ${creditPackage.credits} credits`,
    });
  } catch (error) {
    console.error("Error processing recharge:", error);
    return NextResponse.json(
      { error: "Failed to process recharge" },
      { status: 500 }
    );
  }
}
