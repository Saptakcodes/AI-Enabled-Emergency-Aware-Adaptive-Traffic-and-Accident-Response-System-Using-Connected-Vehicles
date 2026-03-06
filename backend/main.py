from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth import router as auth_router

from database import live_sensor_collection, accident_collection
from models import SensorData, AccidentRecord
from datetime import datetime

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
# NEW API → GET LIVE SENSOR DATA
# =========================
@app.get("/live-data")
async def get_live_data():

    data = await live_sensor_collection.find().to_list(100)

    for d in data:
        d["_id"] = str(d["_id"])

    return data


# =========================
# NEW API → GET ACCIDENT RECORDS
# =========================
@app.get("/accidents")
async def get_accidents():

    data = await accident_collection.find().sort("timestamp", -1).to_list(100)

    for d in data:
        d["_id"] = str(d["_id"])

    return data