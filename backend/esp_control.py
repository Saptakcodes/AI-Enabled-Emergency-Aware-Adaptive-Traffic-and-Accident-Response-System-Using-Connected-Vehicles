# backend/esp_control.py
from fastapi import APIRouter, HTTPException, Depends
from database import esp_devices_collection, traffic_signals_collection
from auth import get_current_user, require_roles
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional
import aiohttp
import asyncio
import json

router = APIRouter(prefix="/esp", tags=["esp hardware"])

class ESPRegisterRequest(BaseModel):
    ip_address: str
    signal_ids: List[str] = []

class ESPCommandRequest(BaseModel):
    signal_id: str
    color: str
    duration: int = 10

@router.post("/register")
async def register_esp(request: ESPRegisterRequest):
    """ESP32 registers itself with the backend."""
    await esp_devices_collection.update_one(
        {"ip_address": request.ip_address},
        {"$set": {
            "ip_address": request.ip_address,
            "signal_ids": request.signal_ids,
            "last_seen": datetime.utcnow(),
            "is_online": True
        }},
        upsert=True
    )
    
    for signal_id in request.signal_ids:
        existing = await traffic_signals_collection.find_one({"signal_id": signal_id})
        if not existing:
            new_signal = {
                "signal_id": signal_id,
                "location": {"type": "Point", "coordinates": [88.471634, 22.693132]},
                "location_name": f"Hardware Signal {signal_id}",
                "current_state": "red",
                "last_updated": datetime.utcnow(),
                "override_active": False,
                "base_cycle_time": 30,
                "current_cycle_time": 30,
                "hardware": True,
                "esp_ip": request.ip_address
            }
            await traffic_signals_collection.insert_one(new_signal)
            print(f"✅ Created hardware signal: {signal_id}")
        else:
            await traffic_signals_collection.update_one(
                {"signal_id": signal_id},
                {"$set": {"hardware": True, "esp_ip": request.ip_address}}
            )
            print(f"✅ Updated existing signal as hardware: {signal_id}")
    
    print(f"✅ ESP32 registered at {request.ip_address} with signals: {request.signal_ids}")
    return {"message": "ESP32 registered"}

@router.get("/devices")
async def get_esp_devices(current_user: dict = Depends(get_current_user)):
    cursor = esp_devices_collection.find()
    devices = await cursor.to_list(100)
    for d in devices:
        d["_id"] = str(d["_id"])
    return devices

@router.post("/command")
async def send_command_to_esp(
    request: ESPCommandRequest,
    current_user: dict = Depends(require_roles(["ambulance", "police", "fire"]))
):
    """
    Send an override command to the ESP32 controlling a specific signal.
    """
    print(f"🔍 Received /command request: {request}")  # DEBUG

    # --- Validate signal_id ---
    if not request.signal_id:
        raise HTTPException(status_code=400, detail="signal_id is required")

    # --- Find ESP32 ---
    esp = await esp_devices_collection.find_one({"signal_ids": request.signal_id})
    if not esp:
        raise HTTPException(status_code=404, detail="No ESP32 found for this signal")

    ip = esp.get("ip_address")
    if not ip:
        raise HTTPException(status_code=404, detail="ESP32 IP not found")

    # --- Build the payload (with signal_id) ---
    payload = {
        "signal_id": request.signal_id,   # <--- CRITICAL
        "color": request.color.upper(),
        "duration": request.duration
    }
    print(f"📦 Payload to ESP32: {payload}")   # DEBUG

    # --- Send to ESP32 ---
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"http://{ip}/override",
                json=payload,
                timeout=5
            ) as response:
                if response.status != 200:
                    print(f"❌ ESP32 returned {response.status}")
                    raise HTTPException(status_code=response.status, detail="ESP32 rejected command")
                result = await response.json()
                print(f"✅ Command sent to ESP32 at {ip}: {payload}")
                return {"message": "Command sent", "esp_response": result}
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="ESP32 not responding")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reach ESP32: {str(e)}")

@router.get("/status/{signal_id}")
async def get_esp_status(signal_id: str):
    esp = await esp_devices_collection.find_one({"signal_ids": signal_id})
    if not esp:
        raise HTTPException(status_code=404, detail="ESP32 not found")
    ip = esp.get("ip_address")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"http://{ip}/status", timeout=3) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise HTTPException(status_code=response.status, detail="ESP32 status error")
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="ESP32 not responding")

# ============= ADD A DIRECT TEST ENDPOINT (for debugging) =============
@router.post("/test")
async def test_command(request: ESPCommandRequest):
    """Bypass all logic – just print and return the payload for testing."""
    print("🧪 TEST endpoint called")
    print(f"Received: {request}")
    payload = {
        "signal_id": request.signal_id,
        "color": request.color.upper(),
        "duration": request.duration
    }
    print(f"Payload that would be sent: {payload}")
    return {"test_payload": payload}