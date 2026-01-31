'use client';

import React, { useState, useRef } from 'react';
import { Camera, Monitor, Link as LinkIcon, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type InputSource = {
  type: 'webcam' | 'screen' | 'url' | 'file';
  content?: string | File;
};

type InputSourceSelectorProps = {
  onSourceSelect: (source: InputSource) => void;
  disabled?: boolean;
};

export function InputSourceSelector({ onSourceSelect, disabled = false }: InputSourceSelectorProps) {
  const [url, setUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onSourceSelect({ type: 'file', content: file });
    }
  };
  
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(url) {
        onSourceSelect({ type: 'url', content: url });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Input Source</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="h-20 flex-col" onClick={() => onSourceSelect({ type: 'webcam' })} disabled={disabled}>
            <Camera className="h-6 w-6" />
            <span>Webcam</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col" onClick={() => onSourceSelect({ type: 'screen' })} disabled={disabled}>
            <Monitor className="h-6 w-6" />
            <span>Screen Share</span>
          </Button>
        </div>

        <div>
          <Label htmlFor="url-input">Remote URL</Label>
          <form onSubmit={handleUrlSubmit} className="flex items-center gap-2 mt-1">
            <Input
              id="url-input"
              type="text"
              placeholder="rtsp://username:password@camera-ip:port/stream-path"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={disabled}
            />
            <Button type="submit" size="icon" aria-label="Load from URL" disabled={disabled}>
                <LinkIcon className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <div>
          <Label htmlFor="file-input">Local File</Label>
          <Input
            id="file-input"
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*"
            className="mt-1"
            disabled={disabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}
