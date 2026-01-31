'use client';

import React, { useMemo } from 'react';
import { AppHeader, AppSidebar } from '@/components/dashboard-components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import type { Alert } from '@/lib/types';
import { useAuthGuard } from '@/hooks/use-auth-guard';

export default function AlertsPage() {
    useAuthGuard('admin');
    const firestore = useFirestore();
    
    const alertsQuery = useMemo(() => (
        firestore ? query(collection(firestore, 'alerts'), orderBy('timestamp', 'desc')) : null
    ), [firestore]);

    const { data: alerts, loading } = useCollection<Alert>(alertsQuery);

    const getPriorityBadge = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'high':
                return <Badge variant="destructive">High</Badge>;
            case 'medium':
                return <Badge variant="secondary">Medium</Badge>;
            case 'low':
            default:
                return <Badge variant="outline">Low</Badge>;
        }
    };
    
    return (
        <div className="flex h-screen flex-row bg-muted/40">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
            <AppHeader />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>All Alerts</CardTitle>
                        <CardDescription>A log of all system and user-generated alerts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Event ID</TableHead>
                                    <TableHead>Zone ID</TableHead>
                                    <TableHead>Message</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center">Loading alerts...</TableCell>
                                    </TableRow>
                                ) : (
                                    alerts.map(alert => (
                                        <TableRow key={alert.id}>
                                            <TableCell>{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}</TableCell>
                                            <TableCell className="font-mono text-xs">{alert.eventId}</TableCell>
                                            <TableCell>{alert.zoneId || 'N/A'}</TableCell>
                                            <TableCell className="font-medium">{alert.message}</TableCell>
                                            <TableCell>{getPriorityBadge(alert.priority)}</TableCell>
                                            <TableCell>
                                                <Badge variant={alert.status === 'resolved' ? 'default' : 'destructive'} className={alert.status === 'pending' ? 'bg-amber-500' : ''}>
                                                    {alert.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
        </div>
    );
}
