from typing import Dict, Any, List

def build_checklist(accident: Dict[str, Any], report_generated: bool = False) -> List[Dict[str, Any]]:
    """
    Build an insurance claim readiness checklist.
    """
    checklist = [
        {"item": "GPS Location", "status": bool(accident.get("latitude") and accident.get("longitude")), "icon": "map-pin"},
        {"item": "Timestamp", "status": bool(accident.get("timestamp")), "icon": "clock"},
        {"item": "Sensor Logs", "status": bool(accident.get("acceleration_g") is not None), "icon": "activity"},
        {"item": "AI Validation", "status": accident.get("ai_confidence", 0) > 0.5, "icon": "brain"},
        {"item": "Vehicle Details", "status": bool(accident.get("vehicle_number")), "icon": "car"},
        {"item": "Driver Details", "status": bool(accident.get("driver_name")), "icon": "user"},
        {"item": "Emergency Timeline", "status": bool(accident.get("timeline")), "icon": "clock"},
        {"item": "Traffic Signal Logs", "status": bool(accident.get("traffic_signal_actions")), "icon": "traffic-light"},
        {"item": "Human Presence Data", "status": accident.get("human_presence") is not None, "icon": "users"},
        {"item": "Fire Detection Logs", "status": accident.get("fire_detected") is not None, "icon": "flame"},
        {"item": "Medical Recommendation", "status": True, "icon": "heart"},
        {"item": "Digital Report Generated", "status": report_generated, "icon": "file-text"}
    ]

    completed = sum(1 for item in checklist if item["status"])
    percentage = int((completed / len(checklist)) * 100)

    return {
        "items": checklist,
        "completed": completed,
        "total": len(checklist),
        "percentage": percentage
    }