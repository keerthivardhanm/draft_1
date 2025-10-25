'use client';
import { useAuthGuard } from '@/hooks/use-auth-guard';

export default function VolunteerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading } = useAuthGuard('volunteer');

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return <>{children}</>;
}
