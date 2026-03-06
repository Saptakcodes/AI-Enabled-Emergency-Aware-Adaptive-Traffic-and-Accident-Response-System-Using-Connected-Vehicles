# backend/database.py
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import sys
import certifi

load_dotenv()

print("="*60)
print("📦 DATABASE INITIALIZATION")
print("="*60)

MONGO_URL = os.getenv("MONGO_URL")
MONGO_URL_BLACKBOX = os.getenv("MONGO_URL_BLACKBOX")

if not MONGO_URL:
    print("❌ CRITICAL: MONGO_URL not found in .env file!")
    sys.exit(1)

if not MONGO_URL_BLACKBOX:
    print("❌ CRITICAL: MONGO_URL_BLACKBOX not found in .env file!")
    sys.exit(1)

print(f"🔌 Connecting to MongoDB Atlas...")

# ===============================
# AUTHENTICATION DATABASE
# ===============================

client = None
db = None
users_collection = None

try:
    client = AsyncIOMotorClient(
        MONGO_URL,
        serverSelectionTimeoutMS=30000,
        connectTimeoutMS=30000,
        socketTimeoutMS=30000,
        tlsCAFile=certifi.where(),
        retryWrites=True,
        retryReads=True
    )

    db = client["authentication_db"]
    users_collection = db["users"]

    print("✅ Authentication DB Connected")
    print("✅ Collection: users")

except Exception as e:
    print(f"\n❌ Failed to create MongoDB client: {e}")
    sys.exit(1)


# ===============================
# BLACKBOX DATABASE
# ===============================

blackbox_db = None
devices_collection = None
live_sensor_collection = None
accident_collection = None

try:

    blackbox_client = AsyncIOMotorClient(
        MONGO_URL_BLACKBOX,
        serverSelectionTimeoutMS=30000,
        connectTimeoutMS=30000,
        socketTimeoutMS=30000,
        tlsCAFile=certifi.where(),
        retryWrites=True,
        retryReads=True
    )

    blackbox_db = blackbox_client["blackbox_data"]

    devices_collection = blackbox_db["devices"]
    live_sensor_collection = blackbox_db["live_sensor_data"]
    accident_collection = blackbox_db["accident_records"]

    print("✅ Blackbox DB Connected")
    print("✅ Collections:")
    print("   - devices")
    print("   - live_sensor_data")
    print("   - accident_records")

except Exception as e:
    print(f"⚠️ Blackbox DB warning: {e}")

print("="*60 + "\n")

__all__ = [
    'client',
    'db',
    'users_collection',
    'blackbox_db',
    'devices_collection',
    'live_sensor_collection',
    'accident_collection'
]