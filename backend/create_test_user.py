# create_test_user.py
from pymongo import MongoClient
from datetime import datetime
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MONGO_URL = os.getenv("MONGO_URL")
print(f"🔌 Connecting to: {MONGO_URL}")

# Connect
client = MongoClient(MONGO_URL)
db = client.get_database()  # authentication_db
users_collection = db["users"]

print(f"📊 Database: {db.name}")
print(f"📁 Collection: {users_collection.name}")

# Create a test user
test_user = {
    "name": "Test User",
    "email": "test@example.com",
    "phone": "1234567890",
    "vehicleNumber": "TEST123",
    "vehicleType": "normal",
    "password": pwd_context.hash("password123"),
    "created_at": datetime.utcnow()
}

# Insert the user
result = users_collection.insert_one(test_user)
print(f"✅ Test user inserted with ID: {result.inserted_id}")

# Verify
count = users_collection.count_documents({})
print(f"📊 Total users in collection: {count}")

# List all databases now
print("\n📚 Databases after insertion:")
for db_name in client.list_database_names():
    print(f"   - {db_name}")