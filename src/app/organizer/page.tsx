import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bell, MessageSquare, QrCode, ShieldCheck, Users } from "lucide-react";

export default function OrganizerDashboard() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <h1 className="text-xl font-semibold">Organizer Dashboard</h1>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">My Zones</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">3</p>
                  <p className="text-xs text-muted-foreground">Assigned Zones</p>
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
                   <p className="text-3xl font-bold">12</p>
                  <p className="text-xs text-muted-foreground">Team members in my zones</p>
                </CardContent>
              </Card>
                 <Card>
                <CardHeader className="pb-2">
                   <CardTitle className="text-lg">Total People</CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-3xl font-bold">1,204</p>
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
                    <BarChart className="h-6 w-6" />
                    <span>Zone Stats</span>
                  </Button>
                </CardContent>
              </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Live Alert Feed</CardTitle>
                 <CardDescription>Real-time incidents in your assigned zones.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"></div>
                        <div className="flex-1">
                            <p className="font-medium">High Density Warning</p>
                            <p className="text-sm text-muted-foreground">Zone A-1 is at 95% capacity. <span className="font-medium">2m ago</span></p>
                        </div>
                    </div>
                     <div className="flex items-start gap-3">
                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-500"></div>
                        <div className="flex-1">
                            <p className="font-medium">SOS - Medical</p>
                            <p className="text-sm text-muted-foreground">User requested medical help in Zone B-3. <span className="font-medium">5m ago</span></p>
                        </div>
                    </div>
                     <div className="flex items-start gap-3">
                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"></div>
                        <div className="flex-1">
                            <p className="font-medium">Overcrowding Alert</p>
                            <p className="text-sm text-muted-foreground">Zone A-2 has exceeded capacity. <span className="font-medium">8m ago</span></p>
                        </div>
                    </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
