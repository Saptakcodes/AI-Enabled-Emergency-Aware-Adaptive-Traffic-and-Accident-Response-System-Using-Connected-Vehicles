from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
print(f"🔌 Connecting to: {MONGO_URL}")

# Connect to MongoDB
client = MongoClient(MONGO_URL)

# Get the database (will be created when first document is inserted)
db = client.get_database()  # This gets authentication_db from URL
print(f"📊 Using database: {db.name}")

# Get the users collection
users_collection = db["users"]
print(f"📁 Using collection: {users_collection.name}")

# Test connection by listing databases (doesn't create anything)
print("📚 Available databases:", client.list_database_names())