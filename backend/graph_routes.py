import networkx as nx

class RoutePlanner:
    def __init__(self):
        self.graph = nx.Graph()

    def add_zone(self, zone):
        self.graph.add_node(zone)

    def connect_zones(self, z1, z2, base_weight=1):
        self.graph.add_edge(z1, z2, weight=base_weight)

    def update_weights(self, zone_risk):
        for u, v, d in self.graph.edges(data=True):
            d["weight"] = 1 + zone_risk.get(v, 0)

    def safest_path(self, source, target):
        return nx.dijkstra_path(self.graph, source, target)
