from fastapi import APIRouter, HTTPException, Depends
from database import traffic_signals_collection
from models import SignalOverride
from auth import get_current_user, require_roles
from datetime import datetime, timedelta

router = APIRouter(prefix="/signals", tags=["traffic signals"])


@router.get("/")
async def get_all_signals():
    """Return all traffic signals with current state."""
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
    return {"message": "Signal overridden"}


@router.post("/update")   # optional, for hardware reporting
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