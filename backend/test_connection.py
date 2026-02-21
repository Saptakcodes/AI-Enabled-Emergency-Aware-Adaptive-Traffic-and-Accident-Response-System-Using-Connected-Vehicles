# test_connection.py
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
print(f"🔌 Connecting to: {MONGO_URL}")

# Connect
client = MongoClient(MONGO_URL)

# Get database from URL
db = client.get_database()
print(f"📊 Database from URL: {db.name}")

# List all databases
print("\n📚 All databases in cluster:")
for db_name in client.list_database_names():
    print(f"   - {db_name}")
    
    # If it's traffic_db or authentication_db, check collections
    if db_name in ["traffic_db", "authentication_db"]:
        db_check = client[db_name]
        collections = db_check.list_collection_names()
        for coll in collections:
            count = db_check[coll].count_documents({})
            print(f"     📁 {coll}: {count} documents")

# Try to insert a test document
test_db = client["test_connection_db"]
test_coll = test_db["test"]
test_coll.insert_one({"test": "data", "timestamp": "now"})
print(f"\n✅ Test database created: test_connection_db")

# Check if traffic_db exists
if "traffic_db" in client.list_database_names():
    traffic_db = client["traffic_db"]
    users_count = traffic_db["users"].count_documents({})
    print(f"\n✅ traffic_db exists with {users_count} users")
else:
    print("\n❌ traffic_db does NOT exist yet")

# Check if authentication_db exists
if "authentication_db" in client.list_database_names():
    auth_db = client["authentication_db"]
    users_count = auth_db["users"].count_documents({})
    print(f"✅ authentication_db exists with {users_count} users")
else:
    print("❌ authentication_db does NOT exist yet")

# Clean up test database
client.drop_database("test_connection_db")
print("🧹 Cleaned up test database")