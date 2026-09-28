from math import atan2, cos, radians, sin, sqrt


EARTH_RADIUS_KM = 6371.0088


def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return straight-line Haversine distance between two GPS points."""
    p1 = radians(lat1)
    p2 = radians(lat2)
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = (
        sin(dlat / 2) ** 2
        + cos(p1) * cos(p2) * sin(dlon / 2) ** 2
    )
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return EARTH_RADIUS_KM * c
