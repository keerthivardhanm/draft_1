'use client';

import React, { useState } from 'react';
import { AppHeader, AppSidebar } from '@/components/dashboard-components';
import { InputSourceSelector, InputSource } from '@/components/input-source-selector';
import { VideoFeed } from '@/components/video-feed';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MonitoringPage() {
  const [inputSource, setInputSource] = useState<InputSource | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSourceSelect = async (source: InputSource) => {
    setInputSource(source);
    setError(null);
    setStream(null);

    try {
      if (source.type === 'webcam') {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(mediaStream);
      } else if (source.type === 'screen') {
        const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setStream(mediaStream);
      } else if (source.type === 'file' && source.content) {
        // The VideoFeed component will handle the file URL directly
      } else if (source.type === 'url' && source.content) {
        // The VideoFeed component will handle the URL directly
      }
    } catch (err) {
      console.error('Error accessing media source:', err);
      setError(`Could not access ${source.type}. Please check permissions and try again.`);
      setInputSource(null);
    }
  };
  
  const handleStop = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setInputSource(null);
    setStream(null);
  }

  return (
    <div className="flex h-screen flex-row bg-muted/40">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Live Video Feed</CardTitle>
                        <CardDescription>Real-time feed from the selected input source for crowd analysis.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <VideoFeed source={inputSource} stream={stream} onStop={handleStop} error={error} />
                    </CardContent>
                </Card>
            </div>
            <div>
                 <InputSourceSelector onSourceSelect={handleSourceSelect} />
                 {/* Placeholder for analysis results */}
                 <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Analysis & Alerts</CardTitle>
                    </CardHeader>
                     <CardContent>
                        <div className="h-48 w-full rounded-md bg-muted flex items-center justify-center">
                            <p className="text-muted-foreground">Live analysis will appear here.</p>
                        </div>
                    </CardContent>
                 </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
