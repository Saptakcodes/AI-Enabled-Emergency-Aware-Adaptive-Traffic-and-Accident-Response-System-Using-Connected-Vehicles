# backend/signals.py
from fastapi import APIRouter, HTTPException, Depends
from database import traffic_signals_collection, esp_devices_collection
from models import SignalOverride
from auth import get_current_user, require_roles
from datetime import datetime, timedelta
import aiohttp
import asyncio

router = APIRouter(prefix="/signals", tags=["traffic signals"])

@router.get("/")
async def get_all_signals():
    cursor = traffic_signals_collection.find()
    signals = await cursor.to_list(100)
    for s in signals:
        s["_id"] = str(s["_id"])
    return signals

# SINGLE override endpoint with hardware integration
@router.put("/{signal_id}/override")
async def override_signal(
    signal_id: str,
    override: SignalOverride,
    current_user: dict = Depends(require_roles(["ambulance", "police", "fire"]))
):
    """Manually force a signal to a given state, optionally with a duration."""
    # 1. Update database
    update = {
        "$set": {
            "current_state": override.new_state,
            "override_active": True,
            "last_updated": datetime.utcnow()
        }
    }
    if override.duration_seconds:
        expiry = datetime.utcnow() + timedelta(seconds=override.duration_seconds)
        update["$set"]["override_expiry"] = expiry

    result = await traffic_signals_collection.update_one(
        {"signal_id": signal_id},
        update
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Signal not found")

    # 2. Send command to hardware if this signal is hardware-controlled
    signal = await traffic_signals_collection.find_one({"signal_id": signal_id})
    if signal and signal.get("hardware"):
        esp_ip = signal.get("esp_ip")
        if esp_ip:
            try:
                payload = {
                    "color": override.new_state.upper(),
                    "duration": override.duration_seconds or 10
                }
                async with aiohttp.ClientSession() as session:
                    await session.post(
                        f"http://{esp_ip}/override",
                        json=payload,
                        timeout=3
                    )
                print(f"✅ Hardware override sent to {signal_id} at {esp_ip}")
            except Exception as e:
                print(f"⚠️ Failed to send hardware command: {e}")
                # Still return success to the user, but log the failure

    return {"message": "Signal overridden"}

@router.post("/update")
async def update_signal_status(data: dict):
    """Allow hardware to report current status."""
    signal_id = data.get("signal_id")
    state = data.get("state")
    if not signal_id or not state:
        raise HTTPException(status_code=400, detail="Missing signal_id or state")
    await traffic_signals_collection.update_one(
        {"signal_id": signal_id},
        {"$set": {"current_state": state, "last_updated": datetime.utcnow()}}
    )
    return {"message": "Status updated"}