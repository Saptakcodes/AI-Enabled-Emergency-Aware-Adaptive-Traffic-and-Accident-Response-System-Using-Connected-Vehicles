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
    # Clear existing (optional – you can comment this out to keep existing)
    await traffic_signals_collection.delete_many({})

    # Define intersections with coordinates (lon, lat)
    raw_signals = [
        {"signal_id": "intersection_1", "lon": 88.3639, "lat": 22.5726},
        {"signal_id": "intersection_2", "lon": 88.3739, "lat": 22.5826},
        {"signal_id": "intersection_3", "lon": 88.3539, "lat": 22.5626},
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