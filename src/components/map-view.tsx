"use client"

import React, { useEffect, useRef, useState } from 'react';
import type { Zone } from '@/lib/types';


const DENSITY_THRESHOLDS = { low: 0.5, medium: 1.0 };
const RISK_DENSITY_MAX = 2.0;
const ZONE_KEY = 'flowtrack_zones_v2';
const COUNTS_KEY = 'flowtrack_counts_v1';


export function MapView() {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [zones, setZones] = useState<Record<string, Zone>>({});
    const [zoneCounts, setZoneCounts] = useState<Record<string, number>>({});
    const [status, setStatus] = useState('Initializing...');
    const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
    const zoneMetaRef = useRef<any[]>([]);
    const simsRef = useRef<any>({});
    const heatmapLayerRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
    const zoneHeatOverlaysRef = useRef<Record<string, google.maps.Polygon>>({});
    const [heatOverlaysVisible, setHeatOverlaysVisible] = useState(true);

    const getRiskColor = (density: number) => {
        if (density < DENSITY_THRESHOLDS.low) return '#2ecc71';
        if (density < DENSITY_THRESHOLDS.medium) return '#f1c40f';
        return '#e74c3c';
    };

    const updateAllZoneCards = () => {
        const zoneMeta = zoneMetaRef.current;
        const newCounts = { ...zoneCounts };
        
        zoneMeta.forEach(z => {
            const count = newCounts[z.id] || 0;
            const area = z.area || 1;
            const density = count / (area / 100);
            const risk = getRiskColor(density);
            const countEl = document.getElementById(`count-${z.id}`);
            if (countEl) countEl.textContent = String(count);
            const fill = document.getElementById(`risk-${z.id}`);
            if (fill) {
                (fill as HTMLElement).style.width = `${Math.min((density / RISK_DENSITY_MAX) * 100, 100)}%`;
                (fill as HTMLElement).style.background = risk;
            }
        });
        updateZoneHeatOverlays(newCounts);
    };

    const renderZoneCard = (z: any) => {
        const list = document.getElementById('zones-list');
        if (!list) return;

        let card = document.getElementById(`card-${z.id}`);
        const areaLabel = ((z.area || 0) / 100).toFixed(1) + ' m²';

        if (!card) {
            card = document.createElement('div');
            card.className = 'card';
            card.id = `card-${z.id}`;
            list.appendChild(card);
        }

        card.innerHTML = `
            <div class="zone-title">
                <strong>${z.name}</strong>
                <span class="badge">${areaLabel}</span>
            </div>
            <div class="zone-stats">People: <span id="count-${z.id}">0</span></div>
            <div class="risk-bar"><div id="risk-${z.id}" class="risk-fill"></div></div>
            <div style="margin-top:8px;display:flex;gap:6px">
                <button data-action="rename" data-zone="${z.id}" class="secondary-button" style="padding:6px 8px">Rename</button>
                <button data-action="delete" data-zone="${z.id}" style="background:#e53935;padding:6px 8px">Delete</button>
            </div>
        `;
        card.querySelector('button[data-action="rename"]')?.addEventListener('click', () => {
            const newName = prompt('Zone name:', z.name) || z.name;
            const zm = zoneMetaRef.current.find(x => x.id === z.id);
            if (zm) {
                zm.name = newName;
                saveZonesToStorage();
                renderZoneCard(zm);
            }
        });
        card.querySelector('button[data-action="delete"]')?.addEventListener('click', () => {
            if (!confirm('Delete zone?')) return;
            const idx = zoneMetaRef.current.findIndex(x => x.id === z.id);
            if (idx >= 0) {
                const zm = zoneMetaRef.current[idx];
                zm.overlay?.setMap(null);
                zoneMetaRef.current.splice(idx, 1);
                saveZonesToStorage();
                card?.remove();
                setZoneCounts(prev => {
                    const newCounts = {...prev};
                    delete newCounts[z.id];
                    return newCounts;
                });
            }
        });
    };
    
    const saveZonesToStorage = () => {
        const saveData = zoneMetaRef.current.map(z => ({ id: z.id, name: z.name, polygon: z.polygon, area: z.area, color: z.color }));
        localStorage.setItem(ZONE_KEY, JSON.stringify(saveData));
    };

    const attachEditHandlers = (meta: any) => {
        const polygon = meta.overlay;
        const syncMeta = () => {
            const path = polygon.getPath().getArray().map((p: google.maps.LatLng) => ({ lat: p.lat(), lng: p.lng() }));
            const area = google.maps.geometry.spherical.computeArea(polygon.getPath());
            meta.polygon = path;
            meta.area = area;
            saveZonesToStorage();
            updateAllZoneCards();
        };
        polygon.getPath().addListener('set_at', syncMeta);
        polygon.getPath().addListener('insert_at', syncMeta);
        polygon.getPath().addListener('remove_at', syncMeta);
    };

    const addZoneToMap = (z: any) => {
        const colors = ["#F44336", "#2196F3", "#4CAF50", "#FFC107", "#9C27B0", "#FF5722"];
        const color = z.color || colors[zoneMetaRef.current.length % colors.length];

        const polygon = new google.maps.Polygon({
            paths: z.polygon,
            strokeColor: color,
            strokeWeight: 2,
            fillColor: color,
            fillOpacity: 0.25,
            editable: true,
            map: map,
        });

        const meta = { ...z, overlay: polygon, color };
        zoneMetaRef.current.push(meta);
        attachEditHandlers(meta);
        renderZoneCard(meta);
        saveZonesToStorage();
    };


    const renderZonesFromStorage = () => {
        zoneMetaRef.current.forEach(z => z.overlay?.setMap(null));
        zoneMetaRef.current = [];
        const list = document.getElementById('zones-list');
        if(list) list.innerHTML = '';

        const raw = localStorage.getItem(ZONE_KEY);
        const saved = raw ? JSON.parse(raw) : [];
        saved.forEach(addZoneToMap);
        updateAllZoneCards();
    };

    const updateZoneHeatOverlays = (currentCounts: Record<string, number>) => {
        if (!map || !google?.maps) return;
        const keep = new Set();
        
        zoneMetaRef.current.forEach(z => {
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
                });
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
            zoneHeatOverlaysRef.current[z.id].setMap(heatOverlaysVisible ? map : null);
        });

        Object.keys(zoneHeatOverlaysRef.current).forEach(id => {
            if (!keep.has(id)) {
                zoneHeatOverlaysRef.current[id].setMap(null);
                delete zoneHeatOverlaysRef.current[id];
            }
        });
    }

    useEffect(() => {
        updateAllZoneCards();
    }, [zoneCounts, heatOverlaysVisible]);

    useEffect(() => {
        if (!mapRef.current || map) return;

        const initMap = () => {
            const mapInstance = new google.maps.Map(mapRef.current!, {
                center: { lat: 13.6288, lng: 79.4192 },
                zoom: 17,
                mapTypeId: 'roadmap'
            });
            setMap(mapInstance);
            setStatus('Ready');
        };

        if (window.google && window.google.maps) {
            initMap();
        }
    }, [mapRef, map]);


    useEffect(() => {
        if (!map) return;

        // Setup Drawing Manager
        const drawingManager = new google.maps.drawing.DrawingManager({
            drawingMode: null,
            drawingControl: true,
            drawingControlOptions: { drawingModes: [google.maps.drawing.OverlayType.POLYGON] },
            polygonOptions: {
                editable: true,
                fillOpacity: 0.2,
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
                const name = prompt('Enter Zone Name:', 'Zone ' + (zoneMetaRef.current.length + 1)) || id;
                
                const newZoneMeta = { id, name, polygon: path, area, overlay: poly };
                addZoneToMap(newZoneMeta);
                
                drawingManager.setDrawingMode(null);
            }
        });
        
        renderZonesFromStorage();

        return () => {
            google.maps.event.removeListener(overlayCompleteListener);
            drawingManager.setMap(null);
        };

    }, [map]);

    const spawnSimulatedPeople = (n: number) => {
        const center = map?.getCenter();
        if (!center) return;

        const baseIndex = Object.keys(simsRef.current).length;
        for (let i = 0; i < n; i++) {
            const lat = center.lat() + (Math.random() - 0.5) * 0.002;
            const lng = center.lng() + (Math.random() - 0.5) * 0.002;
            const pos = new google.maps.LatLng(lat, lng);
            const marker = new google.maps.Marker({
                position: pos,
                map: map,
                icon: { path: google.maps.SymbolPath.CIRCLE, scale: 5, fillColor: '#ff9800', fillOpacity: 1, strokeWeight: 0 },
            });
            const id = 'sim-' + (baseIndex + i);
            simsRef.current[id] = { id, marker, zoneId: null };
            trackSim(id);
        }
    };
    
    const trackSim = (id: string) => {
        setInterval(() => {
            const sim = simsRef.current[id];
            if (!sim || !sim.marker) return;

            const currentPos = sim.marker.getPosition();
            if(!currentPos) return;

            const newPos = new google.maps.LatLng(
                currentPos.lat() + (Math.random() - 0.5) * 0.0005,
                currentPos.lng() + (Math.random() - 0.5) * 0.0005
            );
            sim.marker.setPosition(newPos);
            checkUserInZone(id, newPos);
        }, 2500);
    };

    const checkUserInZone = (simId: string, pos: google.maps.LatLng) => {
        let insideZoneId: string | null = null;
        for (const z of zoneMetaRef.current) {
            if (google.maps.geometry.poly.containsLocation(pos, z.overlay)) {
                insideZoneId = z.id;
                break;
            }
        }
        
        const sim = simsRef.current[simId];
        const prevZoneId = sim.zoneId;

        if (prevZoneId !== insideZoneId) {
            setZoneCounts(prev => {
                const newCounts = {...prev};
                if (prevZoneId) newCounts[prevZoneId] = Math.max(0, (newCounts[prevZoneId] || 0) - 1);
                if (insideZoneId) newCounts[insideZoneId] = (newCounts[insideZoneId] || 0) + 1;
                return newCounts;
            });
            sim.zoneId = insideZoneId;
        }
    };

     const estimateCrowd = async (totalSample = 25000) => {
        if (zoneMetaRef.current.length === 0) { alert('No zones defined'); return; }
        setStatus(`Estimating distribution for ${totalSample} sample audience...`);

        const newCounts: Record<string, number> = {};
        zoneMetaRef.current.forEach(z => newCounts[z.id] = 0);

        const bounds = map?.getBounds();
        if (!bounds) { alert('Map bounds not ready'); return; }
        const sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
        
        const heatPoints: google.maps.LatLng[] = [];
        
        let processed = 0;
        const batch = 2000;
        
        while (processed < totalSample) {
            const take = Math.min(batch, totalSample - processed);
            for (let i = 0; i < take; i++) {
                const lat = sw.lat() + Math.random() * (ne.lat() - sw.lat());
                const lng = sw.lng() + Math.random() * (ne.lng() - sw.lng());
                const point = new google.maps.LatLng(lat, lng);
                for (let z of zoneMetaRef.current) {
                    if (google.maps.geometry.poly.containsLocation(point, z.overlay)) {
                        newCounts[z.id] = (newCounts[z.id] || 0) + 1;
                        heatPoints.push(point);
                        break; 
                    }
                }
            }
            processed += take;
            await new Promise(r => setTimeout(r, 10));
        }

        const sampleTotalInside = Object.values(newCounts).reduce((a,b)=>a+b,0);
        if (sampleTotalInside === 0) {
            alert('No sampled points fell into zones — try zooming in');
            setStatus('Ready');
            return;
        }

        const estimatedCounts: Record<string, number> = {};
        for (let z of zoneMetaRef.current) {
            estimatedCounts[z.id] = Math.round(((newCounts[z.id] || 0) / sampleTotalInside) * totalSample);
        }
        setZoneCounts(estimatedCounts);

        if (google.maps.visualization && heatPoints.length) {
            heatmapLayerRef.current?.setMap(null);
            heatmapLayerRef.current = new google.maps.visualization.HeatmapLayer({
                data: heatPoints,
                map: map,
                radius: 20,
                opacity: 0.6
            });
        }
        
        setStatus(`Estimated distribution applied (sample=${totalSample})`);
    };

    const exportCsv = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Zone ID,Zone Name,People Count,Area (m^2),Density (people/m^2)\n";

        zoneMetaRef.current.forEach(z => {
            const count = zoneCounts[z.id] || 0;
            const area = z.area || 1;
            const density = count / (area / 100);
            csvContent += `${z.id},"${z.name}",${count},${(area/100).toFixed(2)},${density.toFixed(3)}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "crowd_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="map-container">
            <div ref={mapRef} id="map" />
            <div id="right">
                <h2>Flow-Track — Zones & Live Metrics</h2>
                <div className="card controls">
                    <div className="small">Drawing Tools</div>
                    <div style={{ marginTop: '8px' }}>
                        <div className="small">Click the polygon icon on the map to draw a zone. After drawing, zone is saved automatically.</div>
                    </div>
                    <hr className="my-2" />
                    <div className="small">Simulated Attendees (for demo)</div>
                    <div className="sim-row">
                        <input id="sim-count" type="number" min="1" defaultValue="6" />
                        <button id="spawn-sim" onClick={() => spawnSimulatedPeople(Number((document.getElementById('sim-count') as HTMLInputElement).value))}>Spawn</button>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                         <button id="estimate-crowd" className='secondary-button' onClick={() => estimateCrowd(25000)}>Estimate for 25,000</button>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                        <button id="export-csv" onClick={exportCsv}>Download Crowd Report (CSV)</button>
                    </div>
                     <div style={{ marginTop: '8px' }}>
                        <button id="toggle-heat" style={{background: '#8e24aa'}} onClick={() => setHeatOverlaysVisible(v => !v)}>Toggle Zone Heat Overlay</button>
                    </div>
                </div>

                <div id="zones-list"></div>
                <div className="card">
                    <div className="small">System Status</div>
                    <div id="status" className="small">{status}</div>
                    <div style={{ marginTop: '8px' }} className="small">Client-side simulation running.</div>
                </div>
            </div>
        </div>
    )
}
