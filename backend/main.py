from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth import router as auth_router
from routers.insurance import router as insurance_router

from database import (
    live_sensor_collection,
    accident_collection,
    devices_collection,
    post_accident_collection,
    traffic_signals_collection,
)
from models import (
    SensorData,
    AccidentRecord,
    PostAccidentReport,
)
from datetime import datetime, timedelta
import asyncio
import math

from geocoding import router as geocoding_router
from devices import router as devices_router
from signals import router as signals_router
import os

# ----- NEW IMPORT FOR EMERGENCY CALL -----
from utils.notifications import make_emergency_call
# -----------------------------------------

app = FastAPI()

# ====== TEMPORARY FIX FOR OPTIONS /login ======
@app.options("/login")
async def options_login():
    return {}
# ==============================================

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://ai-enabled-emergency-aware-adaptive.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(geocoding_router)
app.include_router(devices_router)
app.include_router(signals_router)
app.include_router(insurance_router)

# Conditionally include development routes
if os.getenv("ENV") == "development":
    from dev_routes import router as dev_router
    app.include_router(dev_router)
    print("⚠️  Development routes enabled (including /dev/seed-signals)")

@app.get("/")
def home():
    return {"message": "FastAPI running 🚀"}


# =========================
# RECEIVE SENSOR DATA
# =========================
@app.post("/sensor-data")
async def receive_sensor_data(data: SensorData):
    sensor_dict = data.dict()
    sensor_dict["timestamp"] = datetime.utcnow()

    print("\n📡 SENSOR DATA RECEIVED")
    print(sensor_dict)

    existing_device = await devices_collection.find_one({"blackbox_id": data.blackbox_id})
    if not existing_device:
        unclaimed = {
            "blackbox_id": data.blackbox_id,
            "user_id": None,
            "vehicle_number": "",
            "vehicle_type": "normal",
            "is_active": False,
            "registered_at": datetime.utcnow(),
            "claimed_at": None
        }
        await devices_collection.insert_one(unclaimed)
        print(f"📌 Unclaimed device created for {data.blackbox_id}")

    await live_sensor_collection.update_one(
        {"blackbox_id": data.blackbox_id},
        {"$set": sensor_dict},
        upsert=True
    )

    return {"message": "Sensor data updated"}


# =========================
# RECORD ACCIDENT (with emergency call)
# =========================
@app.post("/accident")
async def record_accident(data: AccidentRecord):
    accident_dict = data.dict()
    accident_dict["timestamp"] = datetime.utcnow()

    print("\n🚨 ACCIDENT DATA RECEIVED")
    print(accident_dict)

    result = await accident_collection.insert_one(accident_dict)

    # --- Asynchronously place emergency call ---
    asyncio.create_task(background_call(accident_dict))

    return {
        "message": "Accident recorded",
        "id": str(result.inserted_id)
    }

async def background_call(accident_data):
    """Run the synchronous Twilio call in a separate thread."""
    await asyncio.to_thread(make_emergency_call, accident_data)


# =========================
# POST-ACCIDENT DATA
# =========================
@app.post("/post-accident")
async def create_post_accident(data: PostAccidentReport):
    record = data.dict()
    record["timestamp"] = datetime.utcnow()

    print("\n🚑 POST-ACCIDENT DATA RECEIVED")
    print(record)

    result = await post_accident_collection.insert_one(record)

    return {
        "message": "Post-accident data stored",
        "id": str(result.inserted_id)
    }


# =========================
# GET LIVE SENSOR DATA
# =========================
@app.get("/live-data")
async def get_live_data():
    data = await live_sensor_collection.find().to_list(100)
    for d in data:
        d["_id"] = str(d["_id"])
    return data


# =========================
# GET ACCIDENT RECORDS
# =========================
@app.get("/accidents")
async def get_accidents():
    data = await accident_collection.find().sort("timestamp", -1).to_list(100)
    for d in data:
        d["_id"] = str(d["_id"])
    return data


# =========================
# GET LATEST POST-ACCIDENT
# =========================
@app.get("/post-accident/latest/{blackbox_id}")
async def get_latest_post_accident(blackbox_id: str):
    record = await post_accident_collection.find_one(
        {"blackbox_id": blackbox_id},
        sort=[("timestamp", -1)]
    )
    if record:
        record["_id"] = str(record["_id"])
        return record
    return None


# ============================================================================
# TRAFFIC SIGNAL BACKGROUND TASK (Basic Cycling + Emergency Preemption)
# ============================================================================

def haversine(lat1, lon1, lat2, lon2):
    """Calculate great-circle distance between two points in metres."""
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c


async def traffic_signal_loop():
    """Background task that runs every second to update signal states and handle preemption."""
    while True:
        try:
            # 1. Fetch all signals
            signals = await traffic_signals_collection.find().to_list(100)
            now = datetime.utcnow()

            # Get all vehicles with valid coordinates once per loop
            vehicles = await live_sensor_collection.find({
                "latitude": {"$ne": 0},
                "longitude": {"$ne": 0}
            }).to_list(200)

            for sig in signals:
                sig_id = sig["_id"]
                sig_lon, sig_lat = sig["location"]["coordinates"]

                # --- Check for expired override ---
                if sig.get("override_active") and sig.get("override_expiry"):
                    if now < sig["override_expiry"]:
                        continue          # still overridden, skip normal cycle
                    else:
                        # Override expired – clear it
                        await traffic_signals_collection.update_one(
                            {"_id": sig_id},
                            {"$set": {"override_active": False, "override_expiry": None}}
                        )

                # --- Normal cycle (simple round‑robin) ---
                last = sig.get("last_updated") or now
                elapsed = (now - last).total_seconds()
                cycle_time = sig.get("current_cycle_time", 30)
                if elapsed > cycle_time:
                    cycle = {"red": "green", "green": "yellow", "yellow": "red"}
                    new_state = cycle[sig["current_state"]]
                    await traffic_signals_collection.update_one(
                        {"_id": sig_id},
                        {"$set": {"current_state": new_state, "last_updated": now}}
                    )

            # --- Emergency vehicle preemption ---
            for v in vehicles:
                # Get device details to check vehicle type
                device = await devices_collection.find_one({"blackbox_id": v["blackbox_id"]})
                if not device or device.get("vehicle_type") not in ["ambulance", "police", "fire"]:
                    continue

                for sig in signals:
                    sig_lon, sig_lat = sig["location"]["coordinates"]
                    dist = haversine(v["latitude"], v["longitude"], sig_lat, sig_lon)
                    if dist < 300:  # preemption radius (metres)
                        await traffic_signals_collection.update_one(
                            {"_id": sig["_id"]},
                            {"$set": {
                                "current_state": "green",
                                "override_active": True,
                                "override_expiry": now + timedelta(seconds=20),
                                "preempted_by": v["blackbox_id"],
                                "preemption_end_time": now + timedelta(seconds=20)
                            }}
                        )
                        print(f"🚦 Preempted signal {sig['signal_id']} for emergency vehicle {v['blackbox_id']}")

        except Exception as e:
            print(f"Error in traffic signal loop: {e}")

        await asyncio.sleep(1)   # run every second


@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    # Create geospatial index on traffic_signals
    await traffic_signals_collection.create_index([("location", "2dsphere")])
    # Create unique index on signal_id
    await traffic_signals_collection.create_index("signal_id", unique=True)

    # Start background traffic signal loop
    asyncio.create_task(traffic_signal_loop())
    print("✅ Traffic signal background loop started")