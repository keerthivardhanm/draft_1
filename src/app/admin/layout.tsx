'use client';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <SidebarProvider>
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
