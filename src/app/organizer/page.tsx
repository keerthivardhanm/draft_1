'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bell, MessageSquare, QrCode, ShieldCheck, Users, MapPin } from "lucide-react";
import { useUser } from "@/firebase/auth/use-user";
import { useFirestore } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import type { User, SOSReport } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

function OrganizerSosAlertFeed({ assignedZones }: { assignedZones: string[] }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  // Firestore query for SOS reports in the organizer's zones
  const sosQuery = (firestore && assignedZones?.length) ? query(
    collection(firestore, 'sosReports'),
    where('resolved', '==', false),
    where('zoneId', 'in', assignedZones)
  ) : null;

  const { data: sosReports, loading } = useCollection<SOSReport>(sosQuery);

  const handleResolve = async (id: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'sosReports', id), { resolved: true });
      toast({ title: 'SOS Resolved', description: `Report ${id} marked as resolved.` });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not resolve SOS.' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Alert Feed</CardTitle>
        <CardDescription>Real-time incidents in your assigned zones.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading alerts...</p>
        ) : sosReports.length === 0 ? (
          <p className="text-muted-foreground">No active alerts in your zones.</p>
        ) : (
          <div className="space-y-4">
            {sosReports.map(report => (
              <div key={report.id} className="flex items-start gap-4">
                <div className={`mt-1 h-3 w-3 rounded-full ${report.type === 'Medical' ? 'bg-amber-500' : 'bg-red-500'} animate-pulse`} />
                <div className="flex-1">
                  <p className="font-medium">
                    {report.type} SOS in Zone {report.zoneId}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {report.description || "No description provided."}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(report.timestamp), { addSuffix: true })}
                  </p>
                </div>
                <Button size="sm" onClick={() => handleResolve(report.id)}>Resolve</Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function OrganizerDashboard() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();

  // Fetch organizer's data from 'users' collection
  const userDocRef = authUser ? doc(firestore!, 'users', authUser.uid) : null;
  const { data: organizer, loading: userLoading } = useDoc<User>(userDocRef);

  // Fetch volunteers assigned to the same zones as the organizer
  const volunteersQuery = (firestore && organizer?.assignedZones?.length) ? query(
    collection(firestore, 'users'),
    where('role', '==', 'volunteer'),
    where('assignedZones', 'array-contains-any', organizer.assignedZones)
  ) : null;
  const { data: volunteers, loading: volunteersLoading } = useCollection<User>(volunteersQuery);
  
  // Fetch total people count (mock for now, should come from zone data)
  const totalPeopleInZones = 1204;

  const assignedZones = organizer?.assignedZones || [];

  if (userLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading dashboard...</div>
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <h1 className="text-xl font-semibold">Organizer Dashboard</h1>
          {organizer && <span className="text-sm text-muted-foreground">Welcome, {organizer.name}</span>}
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3">
          <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">My Zones</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{assignedZones.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {assignedZones.join(', ') || 'No zones assigned'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                   <CardTitle className="text-lg">Active Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-destructive">5</p>
                  <p className="text-xs text-muted-foreground">Incidents require attention</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                   <CardTitle className="text-lg">Volunteers</CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-3xl font-bold">{volunteersLoading ? '...' : volunteers.length}</p>
                  <p className="text-xs text-muted-foreground">Team members in my zones</p>
                </CardContent>
              </Card>
                 <Card>
                <CardHeader className="pb-2">
                   <CardTitle className="text-lg">Total People</CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-3xl font-bold">{totalPeopleInZones.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">In my zones</p>
                </CardContent>
              </Card>
            </div>
             <Card>
                <CardHeader>
                  <CardTitle>Operational Tools</CardTitle>
                  <CardDescription>Quick access to essential organizer functions.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  <Button variant="outline" className="h-20 flex-col gap-1">
                    <QrCode className="h-6 w-6" />
                    <span>Scan Tickets</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-1">
                    <Bell className="h-6 w-6" />
                    <span>Manage Alerts</span>
                  </Button>
                   <Button variant="outline" className="h-20 flex-col gap-1">
                    <MessageSquare className="h-6 w-6" />
                    <span>Team Chat</span>
                  </Button>
                   <Button variant="outline" className="h-20 flex-col gap-1">
                    <ShieldCheck className="h-6 w-6" />
                    <span>Raise Ticket</span>
                  </Button>
                   <Button variant="outline" className="h-20 flex-col gap-1">
                    <Users className="h-6 w-6" />
                    <span>View Volunteers</span>
                  </Button>
                   <Button variant="outline" className="h-20 flex-col gap-1">
                    <MapPin className="h-6 w-6" />
                    <span>My Zone Maps</span>
                  </Button>
                </CardContent>
              </Card>
          </div>
          <div>
            <OrganizerSosAlertFeed assignedZones={assignedZones} />
          </div>
        </main>
      </div>
    </div>
  );
}
