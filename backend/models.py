from pydantic import BaseModel, EmailStr
from typing import Literal

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


from datetime import datetime
from typing import Optional

#accident-part

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


#traffic-simulation-table-part

class TrafficSignal(BaseModel):
    signal_id: str
    location: dict                     # GeoJSON Point: {"type": "Point", "coordinates": [lon, lat]}
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