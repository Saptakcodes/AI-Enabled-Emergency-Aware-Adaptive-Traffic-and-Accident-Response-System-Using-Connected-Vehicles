# backend/database.py
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import sys
import certifi
import ssl

load_dotenv()

print("="*60)
print("📦 DATABASE INITIALIZATION")
print("="*60)

MONGO_URL = os.getenv("MONGO_URL")
if not MONGO_URL:
    print("❌ CRITICAL: MONGO_URL not found in .env file!")
    sys.exit(1)

print(f"🔌 Connecting to MongoDB Atlas...")

# Global variables
client = None
db = None
users_collection = None

try:
    # Create Motor client with certifi CA bundle
    client = AsyncIOMotorClient(
        MONGO_URL,
        serverSelectionTimeoutMS=30000,
        connectTimeoutMS=30000,
        socketTimeoutMS=30000,
        tlsCAFile=certifi.where(),  # Use certifi's CA bundle
        retryWrites=True,
        retryReads=True
    )
    
    # Get database name from URL
    if "authentication_db" in MONGO_URL:
        db_name = "authentication_db"
    else:
        db_name = "traffic_db"
    
    db = client[db_name]
    users_collection = db["users"]
    
    print("✅ MongoDB client created successfully")
    print(f"✅ Database: {db_name}")
    print(f"✅ Collection: users")
    
except Exception as e:
    print(f"\n❌ Failed to create MongoDB client: {e}")
    print("\n🔧 Troubleshooting steps:")
    print("1. Check if your MongoDB Atlas cluster is running")
    print("2. Go to Network Access and add your IP")
    print("3. Try: pip install --upgrade pymongo motor certifi")
    print("4. Restart your computer and try again")
    sys.exit(1)

print("="*60 + "\n")

__all__ = ['client', 'db', 'users_collection']