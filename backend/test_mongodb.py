# test_mongo.py
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def test_connection():
    MONGO_URL = os.getenv("MONGO_URL")
    print(f"Testing connection to: {MONGO_URL.split('@')[0]}@****")
    
    try:
        # Create client
        client = AsyncIOMotorClient(
            MONGO_URL,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
        )
        
        # Try to ping
        await client.admin.command('ping')
        print("✅ Connection successful!")
        
        # List databases
        dbs = await client.list_database_names()
        print(f"📚 Databases: {dbs}")
        
        # Check if authentication_db exists
        if "authentication_db" in dbs:
            db = client["authentication_db"]
            collections = await db.list_collection_names()
            print(f"📁 Collections in authentication_db: {collections}")
            
            if "users" in collections:
                count = await db.users.count_documents({})
                print(f"👥 Users count: {count}")
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())