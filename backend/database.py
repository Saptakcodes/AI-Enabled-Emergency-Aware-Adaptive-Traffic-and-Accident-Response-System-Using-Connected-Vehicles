# backend/database.py
from pymongo import MongoClient
import os
from dotenv import load_dotenv
import time
import sys

# Load environment variables
load_dotenv()

print("="*60)
print("📦 DATABASE INITIALIZATION")
print("="*60)

MONGO_URL = os.getenv("MONGO_URL")
if MONGO_URL:
    print(f"🔌 Connection string: {MONGO_URL.split('@')[0]}@****")
else:
    print("❌ No MONGO_URL found in .env file!")
    MONGO_URL = "mongodb://localhost:27017"  # Fallback

# ============================================
# IN-MEMORY DATABASE CLASS (Fallback)
# ============================================
class MemoryDatabase:
    """Mock database object"""
    def __init__(self, name):
        self.name = name

class MemoryCollection:
    """In-memory collection that mimics MongoDB collection"""
    def __init__(self, name):
        self.name = name
        self.documents = []
        self.database = MemoryDatabase("memory_db")  # Add database attribute
        print(f"  📁 Created memory collection: {name}")
    
    def find_one(self, query):
        """Find one document matching query"""
        for doc in self.documents:
            matches = True
            for key, value in query.items():
                if doc.get(key) != value:
                    matches = False
                    break
            if matches:
                return doc.copy() if doc else None
        return None
    
    def insert_one(self, document):
        """Insert one document"""
        import copy
        new_doc = copy.deepcopy(document)
        self.documents.append(new_doc)
        print(f"  ✅ [MEMORY] Inserted into {self.name}: {document.get('email', 'unknown')}")
        
        class Result:
            inserted_id = "memory_" + str(len(self.documents))
        return Result()
    
    def count_documents(self, query=None):
        """Count documents"""
        if query is None:
            return len(self.documents)
        count = 0
        for doc in self.documents:
            matches = True
            for key, value in query.items():
                if doc.get(key) != value:
                    matches = False
                    break
            if matches:
                count += 1
        return count
    
    def __repr__(self):
        return f"<MemoryCollection '{self.name}' with {len(self.documents)} docs>"

class MemoryDB:
    """In-memory database that mimics MongoDB database"""
    def __init__(self, name):
        self.name = name
        self._collections = {}
        print(f"  🗄️ Created memory database: {name}")
    
    def __getitem__(self, name):
        """Get collection by name (like db['users'])"""
        if name not in self._collections:
            self._collections[name] = MemoryCollection(name)
        return self._collections[name]
    
    def __getattr__(self, name):
        """Get collection as attribute (like db.users)"""
        if name not in self._collections:
            self._collections[name] = MemoryCollection(name)
        return self._collections[name]
    
    def list_collection_names(self):
        """List all collection names"""
        return list(self._collections.keys())

# ============================================
# ATTEMPT REAL MONGODB CONNECTION
# ============================================
USING_MEMORY_DB = False  # Default value

try:
    print("\n🔍 Attempting MongoDB Atlas connection...")
    
    # Create client with ALL SSL fixes
    client = MongoClient(
        MONGO_URL,
        tls=True,
        tlsAllowInvalidCertificates=True,
        tlsAllowInvalidHostnames=True,
        serverSelectionTimeoutMS=5000,  # 5 second timeout (faster failure)
        connectTimeoutMS=5000,
        socketTimeoutMS=10000,
        retryWrites=True,
        retryReads=True
    )
    
    # JUST PING - DON'T LIST DATABASES!
    print("⏳ Pinging MongoDB...")
    client.admin.command('ping')
    print("✅ SUCCESS: Connected to MongoDB Atlas!")
    
    # Get database
    db = client.get_database()
    print(f"✅ Database: {db.name}")
    
    # Get/create users collection
    users_collection = db["users"]
    print(f"✅ Collection: users")
    
    # Try to count (won't crash if collection is new)
    try:
        count = users_collection.count_documents({})
        print(f"✅ Existing users: {count}")
    except:
        print("✅ Collection ready (new)")
    
    USING_MEMORY_DB = False
    print("\n✅ USING REAL MONGODB DATABASE")
    
except Exception as e:
    print(f"\n❌ MongoDB connection failed: {e}")
    print("\n⚠️ Switching to IN-MEMORY database...")
    
    # Create in-memory database
    db = MemoryDB("memory_db")
    users_collection = db["users"]
    
    USING_MEMORY_DB = True
    print("\n⚠️ USING IN-MEMORY DATABASE (data will reset on restart)")

print("="*60)
print(f"📊 Database ready: {db.name}")
print(f"📁 Collection ready: users")
print(f"📦 Using {'IN-MEMORY' if USING_MEMORY_DB else 'MONGODB'} database")
print("="*60 + "\n")