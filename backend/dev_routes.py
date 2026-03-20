from fastapi import APIRouter, HTTPException, Depends
from database import traffic_signals_collection
from geocoding import reverse_geocode
from datetime import datetime
import os

router = APIRouter(prefix="/dev", tags=["development"])


def dev_only():
    if os.getenv("ENV", "production") != "development":
        raise HTTPException(status_code=403, detail="Not available in production")
    return True


@router.post("/seed-signals", dependencies=[Depends(dev_only)])
async def seed_traffic_signals():
    """Seed a few realistic traffic signals with geocoded names."""
    # Clear existing (optional – comment out to keep existing signals)
    await traffic_signals_collection.delete_many({})

    # Define intersections with coordinates (lon, lat)
    raw_signals = [
        {"signal_id": "device_test_1", "lon": 88.471687, "lat": 22.693016},  # your device location
        {"signal_id": "intersection_2", "lon": 88.473200, "lat": 22.694500},  # example
        {"signal_id": "intersection_3", "lon": 88.470100, "lat": 22.691800},  # example
    ]

    seeded = []
    for s in raw_signals:
        try:
            geo = await reverse_geocode(s["lat"], s["lon"])
            location_name = geo.get("display_name", "Unknown location")
        except Exception as e:
            location_name = f"Intersection at {s['lat']}, {s['lon']}"

        signal_doc = {
            "signal_id": s["signal_id"],
            "location": {"type": "Point", "coordinates": [s["lon"], s["lat"]]},
            "location_name": location_name,
            "current_state": "red",
            "last_updated": datetime.utcnow(),
            "override_active": False,
            "base_cycle_time": 30,
            "current_cycle_time": 30
        }
        await traffic_signals_collection.insert_one(signal_doc)
        seeded.append(s["signal_id"])

    return {"message": f"Seeded {len(seeded)} signals", "signals": seeded}