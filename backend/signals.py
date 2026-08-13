# backend/signals.py
from fastapi import APIRouter, HTTPException, Depends
from database import traffic_signals_collection
from models import SignalOverride
from auth import get_current_user, require_roles
from datetime import datetime, timedelta
from esp_control import send_command_to_esp, ESPCommandRequest

router = APIRouter(prefix="/signals", tags=["traffic signals"])

@router.get("/")
async def get_all_signals():
    cursor = traffic_signals_collection.find()
    signals = await cursor.to_list(100)
    for s in signals:
        s["_id"] = str(s["_id"])
    return signals

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

    # 2. If this is a hardware signal, forward the command via the existing esp_control function
    signal = await traffic_signals_collection.find_one({"signal_id": signal_id})
    if signal and signal.get("hardware"):
        print(f"🔧 Hardware signal {signal_id} – forwarding to ESP32")
        cmd = ESPCommandRequest(
            signal_id=signal_id,
            color=override.new_state,
            duration=override.duration_seconds or 10
        )
        try:
            result_esp = await send_command_to_esp(cmd, current_user)
            print(f"✅ Hardware command sent successfully: {result_esp}")
        except Exception as e:
            print(f"❌ Failed to send hardware command: {e}")
    else:
        print(f"ℹ️ Software signal {signal_id} – no hardware action")

    return {"message": "Signal overridden"}

# ========== NEW ENDPOINT FOR ESP32 STATE SYNC ==========
@router.post("/update")
async def update_signal_status(data: dict):
    """
    Endpoint called by the ESP32 to push its current state.
    Converts the state to lowercase to match the database convention.
    """
    signal_id = data.get("signal_id")
    state = data.get("state")
    if not signal_id or not state:
        raise HTTPException(status_code=400, detail="Missing signal_id or state")
    
    # Convert to lowercase (e.g., "GREEN" → "green")
    state_lower = state.lower()
    
    await traffic_signals_collection.update_one(
        {"signal_id": signal_id},
        {"$set": {"current_state": state_lower, "last_updated": datetime.utcnow()}}
    )
    return {"message": "Status updated"}