'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { VideoOff, AlertTriangle, Loader2 } from 'lucide-react';
import type { InputSource } from './input-source-selector';
import { useToast } from '@/hooks/use-toast';

export interface AnalysisData {
  peopleCount: number;
  maleCount: number;
  femaleCount: number;
  densityLevel: 'low' | 'medium' | 'high';
}

interface VideoFeedProps {
  source: InputSource | null;
  stream: MediaStream | null;
  onStop: () => void;
  onError: (error: string | null) => void;
  onAnalysisUpdate: (data: AnalysisData | null) => void;
}

export function VideoFeed({ source, stream, onStop, onError, onAnalysisUpdate }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const { toast } = useToast();
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);
  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1/model';


  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (error) {
        console.error("Failed to load models:", error);
        onError("Could not load analysis models. Please refresh the page.");
      }
    };
    loadModels();
  }, [onError]);

  // Main effect to handle video stream and analysis
  useEffect(() => {
    const video = videoRef.current;
    if (video && stream) {
      video.srcObject = stream;
    }

    const handlePlay = () => {
      if (detectionInterval.current) clearInterval(detectionInterval.current);
      detectionInterval.current = setInterval(async () => {
        if (!video || video.paused || video.ended || !modelsLoaded) {
          return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const displaySize = { width: video.clientWidth, height: video.clientHeight };
        faceapi.matchDimensions(canvas, displaySize);

        try {
          const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withAgeAndGender();
          const resizedDetections = faceapi.resizeResults(detections, displaySize);

          const context = canvas.getContext('2d');
          if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            // Uncomment to draw landmarks, expressions, etc.
            // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            // faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
          }

          let maleCount = 0;
          let femaleCount = 0;
          detections.forEach(d => {
            if (d.gender === 'male') maleCount++;
            if (d.gender === 'female') femaleCount++;
          });

          const peopleCount = detections.length;
          let densityLevel: AnalysisData['densityLevel'] = 'low';
          if (peopleCount > 10) densityLevel = 'high';
          else if (peopleCount > 4) densityLevel = 'medium';
          
          onAnalysisUpdate({
            peopleCount,
            maleCount,
            femaleCount,
            densityLevel,
          });

        } catch (error) {
            console.error("Error during face detection:", error);
            // Don't spam toasts, just log the error.
        }
      }, 500); // Run detection every 500ms
    };

    if (video) {
        video.addEventListener('play', handlePlay);
    }

    return () => {
      if (video) video.removeEventListener('play', handlePlay);
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, [stream, modelsLoaded, onAnalysisUpdate]);
  
  const getFileUrl = () => {
    if (source?.type === 'file' && source.content instanceof File) {
      return URL.createObjectURL(source.content);
    }
    return null;
  }

  const renderContent = () => {
    const internalError = !modelsLoaded && !source;
    if (internalError) {
       return (
         <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>An error has occured.</AlertDescription>
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
      <div className="relative w-full h-full">
        {!modelsLoaded && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 text-white">
            <Loader2 className="h-12 w-12 animate-spin mb-4" />
            <p className="text-lg font-semibold">Loading Analysis Models...</p>
            <p className="text-sm">This may take a moment.</p>
          </div>
        )}
        <video
          ref={videoRef}
          className="w-full h-full object-cover rounded-md bg-black"
          autoPlay
          muted
          playsInline
          src={ (source.type === 'url' || source.type === 'file') ? videoSource : undefined}
          controls={source.type === 'url' || source.type === 'file'}
          crossOrigin="anonymous" // Required for face-api.js with remote URLs
        />
        {/* The canvas for detection overlay */}
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
        
        {source && (
            <Button onClick={onStop} className="absolute top-4 right-4 z-10" variant="destructive">
                Stop Feed
            </Button>
        )}
      </div>
    );
  };
  
  return (
    <div className="w-full aspect-video rounded-md bg-muted flex items-center justify-center overflow-hidden">
        {renderContent()}
    </div>
  )
}
