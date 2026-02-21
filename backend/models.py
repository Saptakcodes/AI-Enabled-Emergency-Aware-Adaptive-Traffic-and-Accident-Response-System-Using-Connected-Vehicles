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