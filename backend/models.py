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