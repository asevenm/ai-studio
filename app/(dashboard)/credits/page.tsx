import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import React from 'react';

export default async function CreditsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return <div>Please log in to view your credits.</div>;
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { credits: true }
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Credit Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Available Credits</h2>
          <div className="text-4xl font-bold text-purple-600">{user?.credits || 0}</div>
          <p className="mt-4 text-sm text-gray-600">
            Use credits to generate backgrounds, segment products, and create AI copy.
          </p>
          <button className="mt-6 w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
            Top Up Credits
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Recent Transactions</h2>
          <div className="space-y-4">
             {/* Placeholder for transaction history */}
             <div className="flex justify-between items-center py-2 border-b">
                <div>
                    <div className="font-medium text-sm">Background Generation</div>
                    <div className="text-xs text-gray-400">Dec 19, 2025</div>
                </div>
                <div className="text-red-500 font-medium">-1</div>
             </div>
             <div className="flex justify-between items-center py-2 border-b">
                <div>
                    <div className="font-medium text-sm">Product Segmentation</div>
                    <div className="text-xs text-gray-400">Dec 19, 2025</div>
                </div>
                <div className="text-red-500 font-medium">-1</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
