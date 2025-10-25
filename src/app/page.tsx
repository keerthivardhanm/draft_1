'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { Logo } from '@/components/icons';

export default function HomePage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      router.push('/login');
    } else {
      router.push('/admin');
    }
  }, [user, loading, router]);

  return (
     <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex items-center gap-4">
        <Logo className="size-12 text-primary" />
        <h1 className="text-4xl font-bold">CrowdSafe 360°</h1>
      </div>
      <p className="mt-4 text-lg text-muted-foreground">Routing to your dashboard...</p>
    </div>
  );
}
