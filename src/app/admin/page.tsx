'use client';

import * as React from 'react';
import { AppHeader, AppSidebar } from '@/components/dashboard-components';
import { KpiCard, DensityChart, AiPredictions, AiSummaryGenerator } from '@/components/dashboard-components';
import { ReadOnlyMap } from '@/components/read-only-map';
import { CrowdDensityMonitor, type ZoneDensityData } from '@/components/crowd-density-monitor';
import { kpiData } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { SOSReport } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Siren, CheckCircle, Rocket } from 'lucide-react';

function SosAlertFeed() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const sosQuery = React.useMemo(() => (firestore ? query(
    collection(firestore, 'sosReports'),
    where('status', '!=', 'resolved'),
    orderBy('status', 'asc'),
    orderBy('timestamp', 'desc')
  ) : null), [firestore]);
  const { data: sosReports, loading } = useCollection<SOSReport>(sosQuery);

  const handleUpdateStatus = async (id: string, status: SOSReport['status']) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'sosReports', id), { status });
      toast({ title: `SOS ${status.charAt(0).toUpperCase() + status.slice(1)}`, description: `Report ${id} has been marked as ${status}.` });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update the SOS report.' });
    }
  };

  const getStatusBadge = (status: SOSReport['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="destructive">Pending</Badge>;
      case 'dispatched':
        return <Badge className="bg-amber-500 text-white">Dispatched</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500 text-white">Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live SOS Alerts</CardTitle>
        <CardDescription>Real-time emergency reports from audience members.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading alerts...</p>
        ) : sosReports.length === 0 ? (
          <p className="text-muted-foreground">No active SOS alerts.</p>
        ) : (
          <div className="space-y-4">
            {sosReports.map(report => (
              <div key={report.id} className="flex flex-col gap-2 rounded-lg border p-3">
                 <div className="flex items-start gap-4">
                    <div className="mt-1">
                        <Siren className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-center">
                            <p className="font-medium">
                                {report.type} in Zone {report.zoneId || 'N/A'}
                            </p>
                            {getStatusBadge(report.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {report.description || 'No description provided.'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(report.timestamp), { addSuffix: true })} from user {report.userId.substring(0,5)}...
                        </p>
                         <p className="text-xs text-muted-foreground mt-1 font-mono">
                            Coords: {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
                        </p>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                    {report.status === 'pending' && (
                         <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(report.id, 'dispatched')}>
                            <Rocket className="mr-2 h-4 w-4"/>
                            Dispatch
                        </Button>
                    )}
                    <Button size="sm" onClick={() => handleUpdateStatus(report.id, 'resolved')}>
                        <CheckCircle className="mr-2 h-4 w-4"/>
                        Resolve
                    </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


export default function AdminDashboard() {
  const [densityHistory, setDensityHistory] = React.useState<any[]>([]);

  const handleDensityUpdate = React.useCallback((newData: Record<string, ZoneDensityData>) => {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    const newEntry: any = { time: timestamp };
    for (const zoneKey in newData) {
        newEntry[zoneKey] = newData[zoneKey].density;
    }

    setDensityHistory(prevHistory => {
        const updatedHistory = [...prevHistory, newEntry];
        if (updatedHistory.length > 60) { // Store last 60 seconds
            return updatedHistory.slice(updatedHistory.length - 60);
        }
        return updatedHistory;
    });
  }, []);

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

          <div className="mt-6 grid grid-cols-1 gap-6">
             <div className="lg:col-span-3">
                <ReadOnlyMap />
            </div>
          </div>

          <div className="mt-6">
            <CrowdDensityMonitor onDataUpdate={handleDensityUpdate} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <DensityChart data={densityHistory} />
            <SosAlertFeed />
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
