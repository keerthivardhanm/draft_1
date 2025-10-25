'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Siren, QrCode, User, Bell, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { SOSReport } from '@/lib/types';

export default function AudienceDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSosDialogOpen, setIsSosDialogOpen] = useState(false);
  const [sosType, setSosType] = useState('');
  const [sosDescription, setSosDescription] = useState('');

  const handleSosClick = () => {
    setIsSosDialogOpen(true);
  };

  const handleSendSos = async () => {
    if (!user || !firestore || !sosType) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a report type.' });
        return;
    }
    
    // In a real app, you would get this from device location services
    const mockLocation = {
        lat: 13.6288 + (Math.random() - 0.5) * 0.01,
        lng: 79.4192 + (Math.random() - 0.5) * 0.01,
    };

    const newSosReport: Omit<SOSReport, 'id'> = {
        userId: user.uid,
        eventId: 'active-event-id', // This should be dynamic in a multi-event app
        zoneId: 'A', // This should be determined by user's location
        type: sosType,
        description: sosDescription,
        location: mockLocation,
        timestamp: new Date().toISOString(),
        resolved: false,
    };

    try {
        await addDoc(collection(firestore, 'sosReports'), newSosReport);
        toast({ title: 'SOS Sent', description: 'Help is on the way. Stay put.' });
        setIsSosDialogOpen(false);
        setSosType('');
        setSosDescription('');
    } catch (error) {
        console.error("Error sending SOS:", error);
        toast({ variant: 'destructive', title: 'Failed to send SOS', description: 'Please try again or find staff nearby.' });
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4">
       <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="items-center text-center">
          <CardTitle className="text-3xl">Safety & Assistance</CardTitle>
           <CardDescription>Your personal event safety companion.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <Button variant="destructive" size="lg" className="h-40 w-40 rounded-full shadow-lg animate-pulse" onClick={handleSosClick}>
            <Siren className="h-20 w-20" />
            <span className="sr-only">SOS</span>
          </Button>
           <p className="text-center text-lg font-medium text-destructive">Press in case of emergency</p>
           <div className="text-center">
             <Badge variant="secondary">LOCATION SHARING: ACTIVE</Badge>
             <p className="text-xs text-muted-foreground mt-1">Your location is being shared for safety.</p>
           </div>
        </CardContent>
        <CardFooter className="grid grid-cols-4 gap-2">
            <Button variant="outline" className="flex-col h-16">
                <Bell className="h-5 w-5 mb-1"/>
                Alerts
            </Button>
            <Button variant="outline" className="flex-col h-16">
                <QrCode className="h-5 w-5 mb-1"/>
                My Ticket
            </Button>
            <Button variant="outline" className="flex-col h-16">
                <MessageSquare className="h-5 w-5 mb-1"/>
                Chat
            </Button>
            <Button variant="outline" className="flex-col h-16">
                <User className="h-5 w-5 mb-1"/>
                Profile
            </Button>
        </CardFooter>
      </Card>
      
      <Dialog open={isSosDialogOpen} onOpenChange={setIsSosDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Confirm Emergency</DialogTitle>
                <DialogDescription>
                    Please provide some details about your emergency. This will be sent to the event staff immediately.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sos-type" className="text-right">Emergency Type</Label>
                    <Select onValueChange={setSosType} value={sosType}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select type of emergency..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Medical">Medical Assistance</SelectItem>
                            <SelectItem value="Security">Security Threat</SelectItem>
                            <SelectItem value="Lost">Lost Person/Item</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sos-description" className="text-right">Description</Label>
                    <Textarea 
                        id="sos-description" 
                        className="col-span-3" 
                        placeholder="Optional: Provide a brief description of the situation."
                        value={sosDescription}
                        onChange={(e) => setSosDescription(e.target.value)}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsSosDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleSendSos} disabled={!sosType}>Send SOS Now</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
