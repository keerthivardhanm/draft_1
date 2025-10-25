'use client';

import { AppHeader, AppSidebar } from '@/components/dashboard-components';
import { KpiCard, DensityChart, SosChart, AiPredictions, AiSummaryGenerator } from '@/components/dashboard-components';
import { ReadOnlyMap } from '@/components/read-only-map';
import { kpiData } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  return (
    <div className="flex h-screen flex-row bg-muted/40">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {kpiData.map((kpi) => (
              <KpiCard key={kpi.title} kpi={kpi} />
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
             <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                    <CardTitle>Live Event Overview</CardTitle>
                    <CardDescription>Real-time satellite view of the event grounds. Zone editing and live metrics are in the 'Zones' section.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[50vh] w-full rounded-md bg-muted flex items-center justify-center flex-col gap-4">
                      <p className="text-muted-foreground">Read-only map placeholder.</p>
                       <Link href="/admin/zones">
                        <Button>Go to Zone Command Center</Button>
                      </Link>
                    </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <DensityChart />
            <SosChart />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AiPredictions />
            <AiSummaryGenerator />
          </div>
        </main>
      </div>
    </div>
  );
}
