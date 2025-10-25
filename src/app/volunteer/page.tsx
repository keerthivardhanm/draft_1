import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map, MessageSquare, ShieldAlert } from "lucide-react";

export default function VolunteerDashboard() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <main className="flex-1 p-4 sm:p-6">
           <Card>
            <CardHeader>
              <CardTitle>Volunteer Dashboard</CardTitle>
               <CardDescription>Real-time monitoring and incident response for your assigned zones.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>My Mission</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p><strong>Assigned Zone:</strong> Main Stage Right (A-3)</p>
                        <p><strong>Status:</strong> <span className="text-emerald-500">Normal</span></p>
                        <p><strong>People Count:</strong> ~450</p>
                        <div className="mt-4 flex gap-2">
                             <Button>
                                <Map className="mr-2 h-4 w-4"/>
                                View Zone Map
                            </Button>
                             <Button variant="secondary">
                                <ShieldAlert className="mr-2 h-4 w-4"/>
                                Report Incident
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Team Communication</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">No new messages from organizer.</p>
                        <Button className="w-full">
                            <MessageSquare className="mr-2 h-4 w-4"/>
                            Contact Organizer
                        </Button>
                    </CardContent>
                </Card>
            </CardContent>
          </Card>
        </main>
    </div>
  );
}
