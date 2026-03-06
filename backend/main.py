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
        "http://localhost:5173",  # Vite default port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://ai-enabled-emergency-aware-adaptive.vercel.app",  # Your Vercel frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

@app.get("/")
def home():
    return {"message": "FastAPI running 🚀"}


@app.post("/sensor-data")
async def receive_sensor_data(data: SensorData):

    sensor_dict = data.dict()
    sensor_dict["timestamp"] = datetime.utcnow()

    await live_sensor_collection.update_one(
        {"blackbox_id": data.blackbox_id},
        {"$set": sensor_dict},
        upsert=True
    )

    return {"message": "Sensor data updated"}


@app.post("/accident")
async def record_accident(data: AccidentRecord):

    accident_dict = data.dict()
    accident_dict["timestamp"] = datetime.utcnow()

    result = await accident_collection.insert_one(accident_dict)

    return {
        "message": "Accident recorded",
        "id": str(result.inserted_id)
    }