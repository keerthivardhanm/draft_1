def compute_density(count, area):
    return count / area

def classify_risk(density):
    if density < 2:
        return "green"
    elif density < 4:
        return "yellow"
    else:
        return "red"
