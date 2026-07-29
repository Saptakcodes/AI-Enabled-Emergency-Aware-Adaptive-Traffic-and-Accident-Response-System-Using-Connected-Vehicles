from pydantic import BaseModel, EmailStr
from typing import Literal, Optional, List  # ← Added List
from datetime import datetime

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    phone: str
    vehicleNumber: str
    vehicleType: Literal["normal", "ambulance", "police", "fire"]
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class SensorData(BaseModel):
    blackbox_id: str
    latitude: float
    longitude: float
    speed_kmph: float
    acceleration_g: float
    tilt_degree: float
    human_presence: bool
    breathing_detected: bool
    fire_detected: bool
    timestamp: Optional[datetime] = None

class AccidentRecord(BaseModel):
    blackbox_id: str
    latitude: float
    longitude: float
    speed_kmph: float
    acceleration_g: float
    tilt_degree: float
    human_presence: bool
    breathing_detected: bool
    fire_detected: bool
    ambulance_notified: bool = False
    police_notified: bool = False
    timestamp: Optional[datetime] = None

class Device(BaseModel):
    blackbox_id: str
    user_id: Optional[str] = None
    vehicle_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    is_active: bool = False
    registered_at: Optional[datetime] = None
    claimed_at: Optional[datetime] = None

class PostAccidentReport(BaseModel):
    blackbox_id: str
    human_presence: bool
    breathing_detected: bool
    fire_detected: bool
    timestamp: Optional[datetime] = None

class TrafficSignal(BaseModel):
    signal_id: str
    location: dict
    location_name: Optional[str] = None
    current_state: Literal["red", "yellow", "green"]
    last_updated: Optional[datetime] = None
    override_active: bool = False
    override_expiry: Optional[datetime] = None
    preempted_by: Optional[str] = None
    preemption_end_time: Optional[datetime] = None
    base_cycle_time: int = 30
    current_cycle_time: int = 30

class SignalOverride(BaseModel):
    new_state: Literal["red", "yellow", "green"]
    duration_seconds: Optional[int] = None

# =========================
# INSURANCE REPORT MODELS
# =========================
class InsuranceReport(BaseModel):
    report_id: str
    accident_id: str
    case_number: str
    vehicle_number: str
    vehicle_type: str
    owner_name: str
    driver_name: str
    emergency_contact: str
    insurance_policy_number: Optional[str] = None
    date: str
    time: str
    gps_coordinates: dict
    full_address: str
    nearest_landmark: Optional[str] = None
    nearest_hospital: Optional[str] = None
    nearest_police_station: Optional[str] = None
    weather: str = "Clear"
    road_type: Optional[str] = None
    impact_direction: Optional[str] = None
    collision_type: Optional[str] = None
    vehicle_speed: float
    max_g_force: float
    max_tilt: float
    human_presence: bool
    breathing_status: bool
    fire_detected: bool
    ai_confidence: float
    accident_severity: Literal["minor", "moderate", "severe", "critical"]
    emergency_actions_taken: List[str] = []
    traffic_signal_actions: List[str] = []
    green_corridor_activated: bool = False
    manual_override_used: bool = False
    timeline: List[dict] = []
    nearby_responders: List[dict] = []
    ai_summary: str
    checklist: List[dict] = []
    digital_signature: Optional[str] = None
    generated_at: datetime
    report_version: str = "1.0"
    pdf_url: Optional[str] = None
    qr_code_data: Optional[str] = None