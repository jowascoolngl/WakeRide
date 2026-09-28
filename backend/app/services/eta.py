from typing import Optional


def calculate_eta_minutes(distance_km: float, speed_kmph: float) -> Optional[float]:
    """Estimate ETA using current average speed.

    Returns None when speed is zero/unknown.
    """
    if speed_kmph <= 0 or distance_km < 0:
        return None

    return round((distance_km / speed_kmph) * 60, 1)
