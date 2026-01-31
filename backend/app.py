from fastapi import FastAPI, WebSocket
import cv2
from detector import PersonDetector
from classifier import DemographicClassifier
from density import compute_density, classify_risk
from websocket_manager import WSManager

app = FastAPI()
ws_manager = WSManager()
detector = PersonDetector()

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws_manager.connect(ws)

@app.get("/start")
async def start_stream():
    cap = cv2.VideoCapture("rtsp://camera_feed")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        persons = detector.detect(frame)

        zone_stats = {
            "zone1": {"male":0, "female":0, "child":0}
        }

        for p in persons:
            zone = "zone1"  # replace with real zone logic
            zone_stats[zone]["male"] += 1  # demo

        response = {}
        for zone, stats in zone_stats.items():
            total = sum(stats.values())
            density = compute_density(total, area=100)
            risk = classify_risk(density)

            response[zone] = {
                "stats": stats,
                "total": total,
                "density": density,
                "risk": risk
            }

            if risk == "red":
                await ws_manager.broadcast({
                    "alert": "CRITICAL DENSITY",
                    "zone": zone
                })

        await ws_manager.broadcast(response)

    return {"status":"stream ended"}
