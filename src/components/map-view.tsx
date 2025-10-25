"use client"

import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

const DENSITY_THRESHOLDS = { low: 0.5, medium: 1.0 };
const RISK_DENSITY_MAX = 2.0;
const ZONE_KEY = 'flowtrack_zones_v1';
const COUNTS_KEY = 'flowtrack_counts_v1';

type Zone = {
    id: string;
    name: string;
    polygon: { lat: number, lng: number }[];
    area: number;
    overlay: google.maps.Polygon;
};

export function MapView() {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [zones, setZones] = useState<Zone[]>([]);
    const [zoneCounts, setZoneCounts] = useState<Record<string, number>>({});
    const [simCount, setSimCount] = useState(6);
    const [status, setStatus] = useState('Initializing...');
    const simsRef = useRef<Record<string, { id: string; marker: google.maps.Marker }>>({});
    const userZoneMapRef = useRef<Record<string, string | null>>({});
    const zoneHeatOverlaysRef = useRef<Record<string, google.maps.Polygon>>({});
    const heatmapLayerRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
    const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
    
    // BroadcastChannel reference
    const broadcastRef = useRef<BroadcastChannel | null>(null);

    const saveZonesToStorage = (updatedZones: Zone[]) => {
        const zonesToSave = updatedZones.map(z => ({ id: z.id, name: z.name, polygon: z.polygon, area: z.area }));
        localStorage.setItem(ZONE_KEY, JSON.stringify(zonesToSave));
        broadcastRef.current?.postMessage({ type: 'zones-updated', zones: zonesToSave });
    };

    const broadcastPost = (obj: any) => {
        broadcastRef.current?.postMessage(obj);
        if (obj.type === 'counts-updated') {
            localStorage.setItem(COUNTS_KEY, JSON.stringify({ ts: Date.now(), counts: obj.counts }));
        }
    };

    const getRiskColor = (density: number) => {
        if (density < DENSITY_THRESHOLDS.low) return '#2ecc71';
        if (density < DENSITY_THRESHOLDS.medium) return '#f1c40f';
        return '#e74c3c';
    };
    
    const updateZoneHeatOverlays = (currentZones: Zone[], currentCounts: Record<string, number>) => {
        if (!map) return;
        const keep = new Set();
        currentZones.forEach(z => {
            keep.add(z.id);
            const count = currentCounts[z.id] || 0;
            const area = z.area || 1;
            const density = count / (area / 100);
            const color = getRiskColor(density);
            const opacity = Math.max(0.12, Math.min(0.7, (density / RISK_DENSITY_MAX) * 0.7));

            if (zoneHeatOverlaysRef.current[z.id]) {
                zoneHeatOverlaysRef.current[z.id].setOptions({
                    paths: z.polygon,
                    fillColor: color,
                    fillOpacity: opacity,
                    strokeOpacity: 0
                });
                zoneHeatOverlaysRef.current[z.id].setMap(map);
            } else {
                zoneHeatOverlaysRef.current[z.id] = new google.maps.Polygon({
                    paths: z.polygon,
                    strokeOpacity: 0,
                    fillColor: color,
                    fillOpacity: opacity,
                    clickable: false,
                    map: map,
                });
            }
        });

        Object.keys(zoneHeatOverlaysRef.current).forEach(id => {
            if (!keep.has(id)) {
                zoneHeatOverlaysRef.current[id].setMap(null);
                delete zoneHeatOverlaysRef.current[id];
            }
        });
    };

    useEffect(() => {
        updateZoneHeatOverlays(zones, zoneCounts);
    }, [zones, zoneCounts, map]);


    useEffect(() => {
        if (!mapRef.current || map) return;

        const initMap = () => {
            const mapInstance = new google.maps.Map(mapRef.current!, {
                center: { lat: 13.6288, lng: 79.4192 },
                zoom: 17,
                mapTypeId: 'roadmap'
            });
            setMap(mapInstance);
        };

        if (window.google && window.google.maps) {
            initMap();
        } else {
            const interval = setInterval(() => {
                if (window.google && window.google.maps) {
                    clearInterval(interval);
                    initMap();
                }
            }, 100);
        }
    }, [mapRef, map]);

    useEffect(() => {
        if (!map) return;

        // Load initial zones
        const rawZones = localStorage.getItem(ZONE_KEY);
        const loadedZonesData = rawZones ? JSON.parse(rawZones) : [];
        const initialZones: Zone[] = loadedZonesData.map((z: any) => {
            const polygon = new google.maps.Polygon({
                paths: z.polygon,
                strokeColor: '#1e88e5',
                strokeWeight: 2,
                fillColor: '#90caf9',
                fillOpacity: 0.25,
                editable: true,
                map: map,
            });
            const zone = { ...z, overlay: polygon };
            attachEditHandlers(zone, (updatedZone) => {
                setZones(prev => {
                    const newZones = prev.map(zo => zo.id === updatedZone.id ? updatedZone : zo);
                    saveZonesToStorage(newZones);
                    return newZones;
                });
            });
            return zone;
        });
        setZones(initialZones);

        // Load initial counts
        const rawCounts = localStorage.getItem(COUNTS_KEY);
        if (rawCounts) {
            try {
                const parsed = JSON.parse(rawCounts);
                if (parsed.counts) {
                    setZoneCounts(parsed.counts);
                }
            } catch (e) {
                console.error("Failed to parse counts", e);
            }
        }


        // Setup Drawing Manager
        const drawingManager = new google.maps.drawing.DrawingManager({
            drawingMode: null,
            drawingControl: true,
            drawingControlOptions: { drawingModes: [google.maps.drawing.OverlayType.POLYGON] },
            polygonOptions: {
                editable: true,
                fillColor: '#42a5f5',
                fillOpacity: 0.2,
                strokeColor: '#1e88e5',
                strokeWeight: 2,
            },
        });
        drawingManager.setMap(map);
        drawingManagerRef.current = drawingManager;

        const overlayCompleteListener = google.maps.event.addListener(drawingManager, 'overlaycomplete', (e: google.maps.drawing.OverlayCompleteEvent) => {
            if (e.type === google.maps.drawing.OverlayType.POLYGON) {
                const poly = e.overlay as google.maps.Polygon;
                const path = poly.getPath().getArray().map(p => ({ lat: p.lat(), lng: p.lng() }));
                const area = google.maps.geometry.spherical.computeArea(poly.getPath());
                const id = 'zone_' + Date.now();
                const name = prompt('Enter Zone Name:', 'Zone ' + (zones.length + 1)) || id;
                const newZone = { id, name, polygon: path, area, overlay: poly };
                
                attachEditHandlers(newZone, (updatedZone) => {
                    setZones(prev => {
                        const newZones = prev.map(z => z.id === updatedZone.id ? updatedZone : z);
                        saveZonesToStorage(newZones);
                        return newZones;
                    });
                });
                setZones(prev => {
                    const newZones = [...prev, newZone];
                    saveZonesToStorage(newZones);
                    return newZones;
                });
                drawingManager.setDrawingMode(null);
            }
        });

        // Setup BroadcastChannel
        try {
            const bc = new BroadcastChannel('flowtrack_channel_v1');
            broadcastRef.current = bc;
            bc.onmessage = (e) => {
                const msg = e.data;
                if (!msg) return;
                if (msg.type === 'zones-updated') {
                    // Re-render zones from storage to sync across tabs
                     const rawZones = localStorage.getItem(ZONE_KEY);
                     const loadedZonesData = rawZones ? JSON.parse(rawZones) : [];
                     const updatedZones: Zone[] = loadedZonesData.map((z: any) => {
                        const existingZone = zones.find(zn => zn.id === z.id);
                        if (existingZone) {
                            existingZone.overlay.setPaths(z.polygon);
                            return {...existingZone, name: z.name, polygon: z.polygon, area: z.area };
                        }
                        const polygon = new google.maps.Polygon({ paths: z.polygon, map: map, editable: true });
                        const newZone = { ...z, overlay: polygon };
                        attachEditHandlers(newZone, (updatedZone) => {
                            setZones(prev => {
                                const newZones = prev.map(zo => zo.id === updatedZone.id ? updatedZone : zo);
                                saveZonesToStorage(newZones);
                                return newZones;
                            });
                        });
                        return newZone;
                     });
                     setZones(updatedZones.filter(z => loadedZonesData.some((zd:any) => zd.id === z.id)));
                }
                if (msg.type === 'counts-updated') {
                    setZoneCounts(msg.counts || {});
                }
            };
        } catch (err) {
            console.error("BroadcastChannel not supported", err);
            window.addEventListener('storage', (e) => {
                if (e.key === ZONE_KEY) {
                    // Implement similar logic as above for storage event
                }
                if (e.key === COUNTS_KEY && e.newValue) {
                    try {
                        const parsed = JSON.parse(e.newValue);
                        if(parsed.counts) setZoneCounts(parsed.counts);
                    } catch (_) {}
                }
            });
        }
        
        setStatus('Ready');

        return () => {
            google.maps.event.removeListener(overlayCompleteListener);
            drawingManager.setMap(null);
            broadcastRef.current?.close();
        };

    }, [map]);

    const attachEditHandlers = (zone: Zone, onUpdate: (zone: Zone) => void) => {
        const syncMeta = () => {
            const path = zone.overlay.getPath().getArray().map(p => ({ lat: p.lat(), lng: p.lng() }));
            const area = google.maps.geometry.spherical.computeArea(zone.overlay.getPath());
            const updatedZone = { ...zone, polygon: path, area: area };
            onUpdate(updatedZone);
        };
        zone.overlay.getPath().addListener('set_at', syncMeta);
        zone.overlay.getPath().addListener('insert_at', syncMeta);
        zone.overlay.getPath().addListener('remove_at', syncMeta);
        map?.addListener('mouseup', syncMeta);
    };

    const handleRenameZone = (zoneId: string) => {
        const zone = zones.find(z => z.id === zoneId);
        if (!zone) return;
        const newName = prompt('Enter new zone name:', zone.name);
        if (newName && newName !== zone.name) {
            setZones(prev => {
                const newZones = prev.map(z => z.id === zoneId ? { ...z, name: newName } : z);
                saveZonesToStorage(newZones);
                return newZones;
            });
        }
    };

    const handleDeleteZone = (zoneId: string) => {
        if (!confirm('Are you sure you want to delete this zone?')) return;
        setZones(prev => {
            const zoneToRemove = prev.find(z => z.id === zoneId);
            zoneToRemove?.overlay.setMap(null);
            const newZones = prev.filter(z => z.id !== zoneId);
            saveZonesToStorage(newZones);
            return newZones;
        });
        setZoneCounts(prev => {
            const newCounts = { ...prev };
            delete newCounts[zoneId];
            broadcastPost({ type: 'counts-updated', counts: newCounts });
            return newCounts;
        });
    };

    const spawnSimulatedPeople = (n: number) => {
        if (!map) return;
        const baseIndex = Object.keys(simsRef.current).length;
        const center = map.getCenter();
        if(!center) return;

        for (let i = 0; i < n; i++) {
            const pos = randomNearbyPoint(center, 0.001);
            const marker = new google.maps.Marker({
                position: pos,
                map: map,
                icon: { path: google.maps.SymbolPath.CIRCLE, scale: 5, fillColor: '#ff9800', fillOpacity: 1, strokeWeight: 0 },
            });
            const id = 'sim-' + (baseIndex + i);
            simsRef.current[id] = { id, marker };
            trackSim(id);
        }
    };

    const randomNearbyPoint = (center: google.maps.LatLng, radiusDeg: number) => {
        const lat = (typeof center.lat === 'function') ? center.lat() : center.lat;
        const lng = (typeof center.lng === 'function') ? center.lng() : center.lng;
        return new google.maps.LatLng(
            lat + (Math.random() - 0.5) * radiusDeg,
            lng + (Math.random() - 0.5) * radiusDeg
        );
    };

    const trackSim = (id: string) => {
        setInterval(() => {
            const sim = simsRef.current[id];
            if (!sim || !sim.marker || !map) return;
            const pos = randomNearbyPoint(sim.marker.getPosition()!, 0.0005);
            sim.marker.setPosition(pos);
            checkUserInZone(id, pos);
        }, 2500);
    };

    const checkUserInZone = (id: string, pos: google.maps.LatLng) => {
        let inside: string | null = null;
        for(const z of zones) {
            if (google.maps.geometry.poly.containsLocation(pos, z.overlay)) {
                inside = z.id;
                break;
            }
        };

        const prevZone = userZoneMapRef.current[id];
        if (prevZone !== inside) {
            setZoneCounts(prevCounts => {
                const newCounts = {...prevCounts};
                if (prevZone && newCounts[prevZone]) newCounts[prevZone]--;
                if (inside) newCounts[inside] = (newCounts[inside] || 0) + 1;
                broadcastPost({ type: 'counts-updated', counts: newCounts });
                return newCounts;
            });
            userZoneMapRef.current[id] = inside;
        }
    };

    const estimateCrowd = async (totalSample = 25000) => {
        if (zones.length === 0) { alert('No zones defined'); return; }
        if (!map) return;
        setStatus(`Estimating for ${totalSample} people...`);

        const bounds = map.getBounds();
        if (!bounds) { alert('Map bounds not ready'); setStatus('Ready'); return; }

        const newCounts: Record<string, number> = {};
        zones.forEach(z => newCounts[z.id] = 0);

        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const heatPoints: google.maps.LatLng[] = [];

        const batch = 2000;
        let processed = 0;
        while (processed < totalSample) {
            const take = Math.min(batch, totalSample - processed);
            for (let i = 0; i < take; i++) {
                const lat = sw.lat() + Math.random() * (ne.lat() - sw.lat());
                const lng = sw.lng() + Math.random() * (ne.lng() - sw.lng());
                const point = new google.maps.LatLng(lat, lng);
                for (const z of zones) {
                    if (google.maps.geometry.poly.containsLocation(point, z.overlay)) {
                        newCounts[z.id]++;
                        heatPoints.push(point);
                        break;
                    }
                }
            }
            processed += take;
            await new Promise(r => setTimeout(r, 10)); // Yield to main thread
        }

        const sampleTotalInside = Object.values(newCounts).reduce((a, b) => a + b, 0);
        if (sampleTotalInside === 0) {
            alert('No sampled points fell into zones — try zooming in');
            setStatus('Ready');
            return;
        }
        
        const estimatedCounts: Record<string, number> = {};
        for(const z of zones) {
            estimatedCounts[z.id] = Math.round((newCounts[z.id] / sampleTotalInside) * totalSample);
        }

        setZoneCounts(estimatedCounts);
        broadcastPost({ type: 'counts-updated', counts: estimatedCounts });

        if (window.google.maps.visualization && heatPoints.length) {
            if (heatmapLayerRef.current) heatmapLayerRef.current.setMap(null);
            heatmapLayerRef.current = new google.maps.visualization.HeatmapLayer({
                data: heatPoints,
                map: map,
                radius: 20,
                opacity: 0.6
            });
        }
        
        setStatus(`Estimated distribution applied (sample=${totalSample})`);
    };

    const handleExportCsv = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Zone ID,Zone Name,People Count,Area (m^2),Density (people/m^2)\n";
        zones.forEach(z => {
            const count = zoneCounts[z.id] || 0;
            const areaM2 = (z.area / 100);
            const density = count / areaM2;
            csvContent += `${z.id},"${z.name}",${count},${areaM2.toFixed(2)},${density.toFixed(2)}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "crowd_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const [heatOverlayVisible, setHeatOverlayVisible] = useState(true);
    const toggleHeatOverlay = () => {
        setHeatOverlayVisible(prev => {
            const newVisibility = !prev;
            Object.values(zoneHeatOverlaysRef.current).forEach(ov => ov.setMap(newVisibility ? map : null));
            return newVisibility;
        });
    };

    return (
        <div className="map-container">
            <div ref={mapRef} id="map" />
            <div id="right">
                <h2>Flow-Track — Zones & Live Metrics</h2>
                <div className="card controls">
                    <div className="small">Drawing Tools</div>
                    <div className="mt-2 small">Click the polygon icon on the map to draw a zone. After drawing, the zone is saved automatically.</div>
                    <hr className="my-2" />
                    <div className="small">Simulated Attendees (for demo)</div>
                    <div className="sim-row">
                        <Input id="sim-count" type="number" min="1" value={simCount} onChange={(e) => setSimCount(parseInt(e.target.value, 10))}/>
                        <button id="spawn-sim" onClick={() => spawnSimulatedPeople(simCount)}>Spawn</button>
                    </div>
                    <div className="mt-2">
                         <button id="estimate-crowd" className="w-full secondary-button" onClick={() => estimateCrowd(25000)}>Estimate for 25,000</button>
                    </div>
                    <div className="mt-2">
                        <button id="export-csv" onClick={handleExportCsv} className="w-full">Download Crowd Report (CSV)</button>
                    </div>
                    <div className="mt-2">
                        <button
                            onClick={toggleHeatOverlay}
                            className="w-full"
                            style={{ opacity: heatOverlayVisible ? 1 : 0.6, backgroundColor: '#8e24aa' }}
                        >
                            Toggle Zone Heat Overlay
                        </button>
                    </div>
                </div>

                <div id="zones-list">
                    {zones.map(zone => {
                        const count = zoneCounts[zone.id] || 0;
                        const area = zone.area || 1;
                        const density = count / (area / 100);
                        const riskColor = getRiskColor(density);
                        const riskWidth = `${Math.min((density / RISK_DENSITY_MAX) * 100, 100)}%`;

                        return (
                            <div key={zone.id} id={`card-${zone.id}`} className="card">
                                <div className="zone-title">
                                    <strong>{zone.name}</strong>
                                    <span className="badge">{(area / 100).toFixed(1)} m²</span>
                                </div>
                                <div className="zone-stats">
                                    People: <span id={`count-${zone.id}`}>{count}</span>
                                </div>
                                <div className="risk-bar">
                                    <div id={`risk-${zone.id}`} className="risk-fill" style={{ width: riskWidth, background: riskColor }}></div>
                                </div>
                                <div className="mt-2 flex gap-2">
                                    <button onClick={() => handleRenameZone(zone.id)} className="text-xs" style={{backgroundColor: '#6d4c41'}}>Rename</button>
                                    <button onClick={() => handleDeleteZone(zone.id)} className="text-xs" style={{backgroundColor: '#e53935'}}>Delete</button>
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className="card">
                    <div className="small">System Status</div>
                    <div id="status" className="small">{status}</div>
                    <div className="mt-2 small">Communication: BroadcastChannel + localStorage</div>
                </div>
            </div>
        </div>
    )
}
