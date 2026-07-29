from datetime import datetime, timedelta
from typing import List, Dict, Any

def build_timeline(accident: Dict[str, Any], vehicle_data: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """
    Build a structured timeline of events leading up to and after the accident.
    """
    timeline = []
    base_time = accident.get("timestamp")
    if not base_time:
        return timeline

    # Convert to datetime if string
    if isinstance(base_time, str):
        base_time = datetime.fromisoformat(base_time.replace("Z", "+00:00"))

    # Event 1: Vehicle travelling
    timeline.append({
        "timestamp": (base_time - timedelta(seconds=10)).isoformat(),
        "event": "Vehicle travelling",
        "description": f"Vehicle speed {accident.get('speed_kmph', 0):.1f} km/h",
        "severity": "info",
        "icon": "car"
    })

    # Event 2: Abnormal acceleration detected
    if accident.get("acceleration_g", 0) > 2.0:
        timeline.append({
            "timestamp": (base_time - timedelta(seconds=5)).isoformat(),
            "event": "Abnormal acceleration detected",
            "description": f"G-force exceeded {accident.get('acceleration_g', 0):.1f}g",
            "severity": "warning",
            "icon": "speed"
        })

    # Event 3: LSTM anomaly score exceeded
    if accident.get("ai_confidence", 0) > 0.7:
        timeline.append({
            "timestamp": (base_time - timedelta(seconds=4)).isoformat(),
            "event": "LSTM anomaly score exceeded threshold",
            "description": f"Confidence: {accident.get('ai_confidence', 0)*100:.0f}%",
            "severity": "warning",
            "icon": "brain"
        })

    # Event 4: Buzzer activated
    timeline.append({
        "timestamp": (base_time - timedelta(seconds=3)).isoformat(),
        "event": "Buzzer activated",
        "description": "Audible alert initiated",
        "severity": "warning",
        "icon": "bell"
    })

    # Event 5: Cancellation window started
    timeline.append({
        "timestamp": (base_time - timedelta(seconds=3)).isoformat(),
        "event": "5‑second cancellation window started",
        "description": "Driver can cancel by pressing button",
        "severity": "info",
        "icon": "timer"
    })

    # Event 6: No cancellation received
    if accident.get("cancellation_window_expired", True):
        timeline.append({
            "timestamp": (base_time - timedelta(seconds=0)).isoformat(),
            "event": "No cancellation received",
            "description": "Window expired without driver input",
            "severity": "critical",
            "icon": "close"
        })

    # Event 7: Accident confirmed
    timeline.append({
        "timestamp": base_time.isoformat(),
        "event": "Accident confirmed",
        "description": "System automatically confirmed collision",
        "severity": "critical",
        "icon": "alert"
    })

    # Event 8: Emergency alert sent
    timeline.append({
        "timestamp": (base_time + timedelta(seconds=1)).isoformat(),
        "event": "Emergency alert sent",
        "description": "Twilio voice call initiated",
        "severity": "critical",
        "icon": "phone"
    })

    # Event 9: Nearby hospital identified
    if accident.get("nearest_hospital"):
        timeline.append({
            "timestamp": (base_time + timedelta(seconds=2)).isoformat(),
            "event": "Nearest hospital identified",
            "description": accident.get("nearest_hospital"),
            "severity": "info",
            "icon": "hospital"
        })

    # Event 10: Traffic signals overridden
    if accident.get("traffic_signal_actions"):
        timeline.append({
            "timestamp": (base_time + timedelta(seconds=3)).isoformat(),
            "event": "Traffic signals overridden",
            "description": f"{len(accident.get('traffic_signal_actions', []))} signals set to green",
            "severity": "success",
            "icon": "traffic"
        })

    # Event 11: Green corridor activated
    if accident.get("green_corridor_activated", False):
        timeline.append({
            "timestamp": (base_time + timedelta(seconds=4)).isoformat(),
            "event": "Green corridor activated",
            "description": "Emergency route cleared for ambulance",
            "severity": "success",
            "icon": "road"
        })

    # Event 12: Insurance report generated
    timeline.append({
        "timestamp": (base_time + timedelta(seconds=10)).isoformat(),
        "event": "Insurance report generated",
        "description": "AI‑generated report ready for download",
        "severity": "success",
        "icon": "file"
    })

    return timeline