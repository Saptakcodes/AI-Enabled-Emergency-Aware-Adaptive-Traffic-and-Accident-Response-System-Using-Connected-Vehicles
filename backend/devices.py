# backend/devices.py
from fastapi import APIRouter, HTTPException, Depends
from database import devices_collection, users_collection
from auth import get_current_user
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/devices", tags=["devices"])

class ClaimRequest(BaseModel):
    blackbox_id: str

@router.post("/claim")
async def claim_device(
    request: ClaimRequest,
    current_user: dict = Depends(get_current_user)
):
    """Claim an unclaimed device by blackbox_id."""
    blackbox_id = request.blackbox_id

    # Find the device (auto-created)
    device = await devices_collection.find_one({"blackbox_id": blackbox_id})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found. Has it sent data yet?")

    # Check if already claimed
    if device.get("user_id"):
        raise HTTPException(status_code=400, detail="Device already claimed by another user")

    # Get user details from database
    user_email = current_user.get("email")
    user = await users_collection.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    vehicle_number = user.get("vehicleNumber", "")
    vehicle_type = user.get("vehicleType", "normal")

    # Update device
    await devices_collection.update_one(
        {"blackbox_id": blackbox_id},
        {"$set": {
            "user_id": user_email,
            "vehicle_number": vehicle_number,
            "vehicle_type": vehicle_type,
            "is_active": True,
            "claimed_at": datetime.utcnow()
        }}
    )

    return {"message": "Device claimed successfully"}

@router.get("/my-devices")
async def get_my_devices(current_user: dict = Depends(get_current_user)):
    """Get all devices belonging to the logged-in user."""
    cursor = devices_collection.find({"user_id": current_user.get("email")})
    devices = await cursor.to_list(100)
    for d in devices:
        d["_id"] = str(d["_id"])
    return devices

@router.get("/{blackbox_id}")
async def get_device(blackbox_id: str, current_user: dict = Depends(get_current_user)):
    """Get details of a specific device (user must own it)."""
    device = await devices_collection.find_one({"blackbox_id": blackbox_id})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    if device.get("user_id") != current_user.get("email"):
        raise HTTPException(status_code=403, detail="Not authorized to view this device")
    device["_id"] = str(device["_id"])
    return device

@router.put("/{blackbox_id}/deactivate")
async def deactivate_device(blackbox_id: str, current_user: dict = Depends(get_current_user)):
    """Soft-delete a device (set is_active=False)."""
    device = await devices_collection.find_one({"blackbox_id": blackbox_id})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    if device.get("user_id") != current_user.get("email"):
        raise HTTPException(status_code=403, detail="Not authorized")
    await devices_collection.update_one(
        {"blackbox_id": blackbox_id},
        {"$set": {"is_active": False}}
    )
    return {"message": "Device deactivated"}