'use client';

import { AdminSidebar } from "@/components/admin/sidebar";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminUser } from "@/lib/definitions";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const isAdmin = user && user.role !== 'user';
  const isActive = isAdmin && (user.role === 'superadmin' || (user as AdminUser).visible !== false);

  useEffect(() => {
    if (!isUserLoading && !isActive) {
      router.push('/');
    }
  }, [user, isUserLoading, isActive, router]);

  if (isUserLoading || !isActive) {
    return (
      <div className="flex min-h-screen">
        <aside className="hidden md:flex flex-col w-64 border-r bg-card h-screen sticky top-0 p-4 space-y-4">
          <Skeleton className="h-10 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </aside>
        <main className="flex-1 p-4 md:p-8 bg-muted/40 space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-8 bg-muted/40">{children}</main>
    </div>
  );
}
