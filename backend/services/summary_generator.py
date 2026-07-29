from datetime import datetime
from typing import Dict, Any

def generate_accident_summary(accident: Dict[str, Any], location_info: Dict[str, Any] = None) -> str:
    """
    Generate a professional natural-language summary of the accident.
    """
    vehicle_number = accident.get("vehicle_number", "Unknown vehicle")
    speed = accident.get("speed_kmph", 0)
    g_force = accident.get("acceleration_g", 0)
    tilt = accident.get("tilt_degree", 0)
    fire = accident.get("fire_detected", False)
    human_presence = accident.get("human_presence", False)
    breathing = accident.get("breathing_detected", False)

    # Location info
    if location_info:
        address = location_info.get("display_name", "Unknown location")
        city = location_info.get("city", "")
    else:
        lat = accident.get("latitude", 0)
        lon = accident.get("longitude", 0)
        address = f"{lat:.4f}, {lon:.4f}"

    # Determine collision type
    collision_type = "frontal" if g_force > 3 else "side"
    if tilt > 30:
        collision_type = "rollover"

    # Severity
    if g_force > 5 or tilt > 40:
        severity = "severe"
    elif g_force > 3 or tilt > 20:
        severity = "moderate"
    else:
        severity = "minor"

    # Build summary
    summary = f"Vehicle {vehicle_number} experienced a {severity} {collision_type} collision at approximately {speed:.0f} km/h near {address}."

    if g_force > 0:
        summary += f" Maximum impact recorded was {g_force:.1f} g with a vehicle inclination of {tilt:.1f}°."

    # Driver cancellation
    if accident.get("cancellation_window_expired", True):
        summary += " Driver cancellation window expired without response."
    else:
        summary += " Driver successfully cancelled the alert."

    # Occupant status
    if human_presence:
        if breathing:
            summary += " Occupant presence and breathing were detected."
        else:
            summary += " Occupant presence detected but no breathing detected."
    else:
        summary += " No occupant presence detected."

    # Fire
    if fire:
        summary += " Fire hazards were observed."
    else:
        summary += " No fire hazards were observed."

    # Nearby services
    if location_info and location_info.get("nearest_hospital"):
        summary += f" The nearest hospital is {location_info['nearest_hospital']}."

    # Traffic actions
    if accident.get("green_corridor_activated", False):
        summary += " Traffic management activated an emergency green corridor to accelerate ambulance arrival."

    summary += " Insurance documentation has been automatically prepared."

    return summary