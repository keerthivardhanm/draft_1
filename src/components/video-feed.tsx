'use client';

import React, { useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { VideoOff, AlertTriangle } from 'lucide-react';
import { InputSource } from './input-source-selector';

interface VideoFeedProps {
  source: InputSource | null;
  stream: MediaStream | null;
  onStop: () => void;
  error: string | null;
}

export function VideoFeed({ source, stream, onStop, error }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  
  const getFileUrl = () => {
    if (source?.type === 'file' && source.content instanceof File) {
      return URL.createObjectURL(source.content);
    }
    return null;
  }

  const renderContent = () => {
    if (error) {
       return (
         <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
         </Alert>
       )
    }
      
    if (!source) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <VideoOff className="h-16 w-16" />
          <p className="mt-4">No video source selected</p>
          <p className="text-sm">Select an input source to begin monitoring.</p>
        </div>
      );
    }

    const videoSource = source.type === 'file' ? getFileUrl() : source.content as string;

    return (
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full aspect-video rounded-md bg-black"
          autoPlay
          muted
          playsInline
          src={ (source.type === 'url' || source.type === 'file') ? videoSource : undefined}
          controls={source.type === 'url' || source.type === 'file'}
        />
        {/* The canvas for heatmap overlay will go here */}
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50" />
         <Button onClick={onStop} className="absolute top-4 right-4" variant="destructive">
            Stop Feed
        </Button>
      </div>
    );
  };
  
  return (
    <div className="w-full aspect-video rounded-md bg-muted flex items-center justify-center">
        {renderContent()}
    </div>
  )
}
