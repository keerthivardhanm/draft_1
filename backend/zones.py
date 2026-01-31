from shapely.geometry import Point, Polygon

class ZoneManager:
    def __init__(self, zones):
        """
        zones = {
            "zone1": Polygon([...]),
            "zone2": Polygon([...])
        }
        """
        self.zones = zones

    def assign_zone(self, bbox):
        x1,y1,x2,y2 = bbox
        cx, cy = (x1+x2)//2, (y1+y2)//2
        point = Point(cx, cy)

        for name, polygon in self.zones.items():
            if polygon.contains(point):
                return name

        return None
