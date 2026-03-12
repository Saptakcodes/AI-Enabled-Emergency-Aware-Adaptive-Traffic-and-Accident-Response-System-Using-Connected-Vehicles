from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth import router as auth_router

from database import (
    live_sensor_collection,
    accident_collection,
    devices_collection,
    post_accident_collection,          # ← ADDED
)
from models import (
    SensorData,
    AccidentRecord,
    PostAccidentReport,                # ← ADDED
)
from datetime import datetime

from geocoding import router as geocoding_router
from devices import router as devices_router

app = FastAPI()

# Update CORS configuration
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

app.include_router(auth_router)
app.include_router(geocoding_router)
app.include_router(devices_router)

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

    # PRINT DATA IN TERMINAL
    print("\n📡 SENSOR DATA RECEIVED")
    print(sensor_dict)

    # Auto‑create unclaimed device if it doesn't exist
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
# RECORD ACCIDENT
# =========================
@app.post("/accident")
async def record_accident(data: AccidentRecord):

    accident_dict = data.dict()
    accident_dict["timestamp"] = datetime.utcnow()

    # PRINT ACCIDENT DATA
    print("\n🚨 ACCIDENT DATA RECEIVED")
    print(accident_dict)

    result = await accident_collection.insert_one(accident_dict)

    return {
        "message": "Accident recorded",
        "id": str(result.inserted_id)
    }


# =========================
# NEW: POST-ACCIDENT DATA
# =========================
@app.post("/post-accident")
async def create_post_accident(data: PostAccidentReport):
    """Receive continuous monitoring data after an accident."""
    record = data.dict()
    record["timestamp"] = datetime.utcnow()

    # PRINT DATA IN TERMINAL
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