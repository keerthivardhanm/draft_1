'use client';

import { AppHeader, AppSidebar } from '@/components/dashboard-components';
import { MapView } from '@/components/map-view';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function ZonesPage() {
  return (
    <div className="flex h-screen flex-row bg-muted/40">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Zone Command Center</CardTitle>
                    <CardDescription>
                        Use the tools on the map to draw, edit, and manage event zones. Monitor live crowd data and run simulations.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <MapView />
                </CardContent>
            </Card>
        </main>
      </div>
    </div>
  );
}
