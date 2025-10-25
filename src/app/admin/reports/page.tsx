'use client';

import { AppHeader, AppSidebar } from '@/components/dashboard-components';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuthGuard } from '@/hooks/use-auth-guard';

export default function ReportsPage() {
    useAuthGuard('admin');
  return (
    <div className="flex h-screen flex-row bg-muted/40">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Reports</CardTitle>
                    <CardDescription>
                        Generate and view reports for events, zones, and user activity.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="h-[70vh] w-full rounded-md bg-muted flex items-center justify-center">
                        <p className="text-muted-foreground">Reporting features will be available here.</p>
                     </div>
                </CardContent>
            </Card>
        </main>
      </div>
    </div>
  );
}
