import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const packages = await prisma.creditPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(packages);
  } catch (error) {
    console.error("Error fetching credit packages:", error);
    return NextResponse.json(
      { error: "Failed to fetch credit packages" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, credits, price, currency = "CNY", sortOrder = 0 } = body;

    if (!name || !credits || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newPackage = await prisma.creditPackage.create({
      data: {
        name,
        credits,
        price,
        currency,
        sortOrder,
      },
    });

    return NextResponse.json(newPackage);
  } catch (error) {
    console.error("Error creating credit package:", error);
    return NextResponse.json(
      { error: "Failed to create credit package" },
      { status: 500 }
    );
  }
}
