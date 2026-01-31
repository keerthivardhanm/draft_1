from ultralytics import YOLO

class PersonDetector:
    def __init__(self):
        self.model = YOLO("yolov8n.pt")  # lightweight

    def detect(self, frame):
        results = self.model(frame, stream=True)
        persons = []

        for r in results:
            for box in r.boxes:
                cls = int(box.cls[0])
                if cls == 0:  # person class
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    persons.append((x1, y1, x2, y2))

        return persons
