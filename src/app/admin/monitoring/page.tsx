'use client';

import React, { useState, useEffect } from 'react';
import { AppHeader, AppSidebar } from '@/components/dashboard-components';
import { InputSourceSelector, InputSource } from '@/components/input-source-selector';
import { VideoFeed, AnalysisData } from '@/components/video-feed';
import { AnalysisResults } from '@/components/analysis-results';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function MonitoringPage() {
  const firestore = useFirestore();
  const [inputSource, setInputSource] = useState<InputSource | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSourceSelect = async (source: InputSource) => {
    setInputSource(source);
    setError(null);
    setStream(null);
    setAnalysisData(null); // Reset analysis data

    try {
      if (source.type === 'webcam') {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(mediaStream);
      } else if (source.type === 'screen') {
        const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setStream(mediaStream);
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
    setAnalysisData(null);
  }

  // Effect to save analysis data to Firestore every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (firestore && analysisData && inputSource) {
        const { peopleCount, densityLevel } = analysisData;
        
        let sourceInfo: string;
        switch(inputSource.type) {
            case 'file':
                sourceInfo = (inputSource.content instanceof File) ? inputSource.content.name : 'Local File';
                break;
            case 'url':
                sourceInfo = inputSource.content as string;
                break;
            case 'webcam':
                sourceInfo = 'Webcam Feed';
                break;
            case 'screen':
                sourceInfo = 'Screen Share';
                break;
            default:
                sourceInfo = 'Unknown';
        }

        addDoc(collection(firestore, 'heatmapRuns'), {
          eventId: 'active-event-id', // Hardcoded for now
          timestamp: serverTimestamp(),
          sourceType: inputSource.type,
          sourceInfo: sourceInfo || '', // Ensure it's never undefined
          zoneAnalytics: [ // Simulating for one zone for now
            {
              zoneId: 'monitor_zone',
              crowdCount: peopleCount,
              densityLevel: densityLevel,
              alertTriggered: densityLevel === 'high',
            }
          ],
          heatmapSnapshotUrl: '', // Placeholder for snapshot URL
        });
      }
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [analysisData, inputSource, firestore]);

  return (
    <div className="flex h-screen flex-row bg-muted/40">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <VideoFeed 
                    source={inputSource} 
                    stream={stream} 
                    onStop={handleStop} 
                    onError={setError}
                    onAnalysisUpdate={setAnalysisData}
                />
            </div>
            <div>
                 <InputSourceSelector onSourceSelect={handleSourceSelect} disabled={!!inputSource}/>
                 <AnalysisResults data={analysisData} error={error} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
