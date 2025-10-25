import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Siren, QrCode, User, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AudienceDashboard() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4">
       <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="items-center text-center">
          <CardTitle className="text-3xl">Safety & Assistance</CardTitle>
           <CardDescription>Your personal event safety companion.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <Button variant="destructive" size="lg" className="h-40 w-40 rounded-full shadow-lg animate-pulse">
            <Siren className="h-20 w-20" />
            <span className="sr-only">SOS</span>
          </Button>
           <p className="text-center text-lg font-medium text-destructive">Press in case of emergency</p>
           <div className="text-center">
             <Badge variant="secondary">LOCATION SHARING: ACTIVE</Badge>
             <p className="text-xs text-muted-foreground mt-1">Your location is being shared for safety.</p>
           </div>
        </CardContent>
        <CardFooter className="grid grid-cols-3 gap-2">
            <Button variant="outline" className="flex-col h-16">
                <Bell className="h-5 w-5 mb-1"/>
                Alerts
            </Button>
            <Button variant="outline" className="flex-col h-16">
                <QrCode className="h-5 w-5 mb-1"/>
                My Ticket
            </Button>
            <Button variant="outline" className="flex-col h-16">
                <User className="h-5 w-5 mb-1"/>
                Profile
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
