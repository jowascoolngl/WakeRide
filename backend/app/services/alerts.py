from typing import Tuple


# Distances are deliberately simple for the MVP.
# A production version can make these user-configurable.
def get_alert(distance_km: float) -> Tuple[str, str]:
    if distance_km <= 0.20:
        return "ARRIVED", "Your destination is here. Get off now!"

    if distance_km <= 0.50:
        return "CRITICAL", "Your stop is very close. Get ready!"

    if distance_km <= 2.00:
        return "WAKE_UP", "Your destination is approaching."

    if distance_km <= 5.00:
        return "PREPARE", "Your destination is coming up."

    return "NORMAL", "Journey in progress."
