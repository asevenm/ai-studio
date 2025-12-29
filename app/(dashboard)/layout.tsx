import React from 'react';
import AppHeader from '@/components/layout/AppHeader';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <AppHeader />
      <main>{children}</main>
    </div>
  );
}
