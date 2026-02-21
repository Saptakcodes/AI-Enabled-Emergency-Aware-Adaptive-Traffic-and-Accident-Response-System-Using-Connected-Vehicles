# backend/auth.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import users_collection, USING_MEMORY_DB
from models import UserSignup, UserLogin
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta

from dotenv import load_dotenv
import os
from pathlib import Path


# =========================
# LOAD ENVIRONMENT VARIABLES
# =========================

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

print("SECRET_KEY:", SECRET_KEY)
print("ALGORITHM:", ALGORITHM)
print("EXPIRE:", ACCESS_TOKEN_EXPIRE_MINUTES)


# =========================
# ROUTER INIT
# =========================

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# =========================
# CREATE TEST USER (for in-memory mode)
# =========================
if USING_MEMORY_DB:
    try:
        # Check if test user exists
        test_user = users_collection.find_one({"email": "test@example.com"})
        if not test_user:
            # Create test user
            test_user_data = {
                "name": "Test User",
                "email": "test@example.com",
                "phone": "1234567890",
                "vehicleNumber": "TEST001",
                "vehicleType": "normal",
                "password": pwd_context.hash("password123"),
                "created_at": datetime.utcnow()
            }
            users_collection.insert_one(test_user_data)
            print("✅ Test user created: test@example.com / password123")
        else:
            print("✅ Test user already exists")
    except Exception as e:
        print(f"⚠️ Could not create test user: {e}")

# =========================
# PASSWORD FUNCTIONS
# =========================

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


# =========================
# JWT TOKEN CREATION
# =========================

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# =========================
# TOKEN VERIFICATION
# =========================

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# =========================
# SIGNUP
# =========================

@router.post("/signup")
def signup(user: UserSignup):
    print("\n" + "="*50)
    print("🔍 SIGNUP ATTEMPT")
    print("="*50)
    print(f"📧 Email: {user.email}")
    print(f"👤 Name: {user.name}")
    
    # Safely print database info
    try:
        if hasattr(users_collection, 'database') and users_collection.database:
            print(f"📊 Database: {users_collection.database.name}")
        else:
            print(f"📊 Database: memory_db")
    except:
        print(f"📊 Database: memory_db")
    
    try:
        print(f"📁 Collection: {users_collection.name}")
    except:
        print(f"📁 Collection: users")
    
    # Check if user exists
    existing_user = users_collection.find_one({"email": user.email})
    if existing_user:
        print(f"❌ User already exists: {user.email}")
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = hash_password(user.password)
    
    # Create user dict with ALL fields from your model
    user_dict = {
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "vehicleNumber": user.vehicleNumber,
        "vehicleType": user.vehicleType,
        "password": hashed_password,
        "created_at": datetime.utcnow()
    }
    
    print(f"📝 User dict prepared: {user_dict['email']}")
    
    # Insert user
    try:
        result = users_collection.insert_one(user_dict)
        print(f"✅ SUCCESS! User inserted with ID: {result.inserted_id}")
        
        # Verify insertion
        saved_user = users_collection.find_one({"email": user.email})
        if saved_user:
            print(f"✅ Verified: User found in database")
            print(f"📊 Database now has {users_collection.count_documents({})} total users")
        else:
            print(f"❌ ERROR: User not found after insertion!")
            
        return {"message": "User registered successfully"}
        
    except Exception as e:
        print(f"❌ ERROR inserting user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
# =========================
# LOGIN
# =========================

@router.post("/login")
def login(user: UserLogin):
    print("\n" + "="*50)
    print("🔍 LOGIN ATTEMPT")
    print("="*50)
    print(f"📧 Email: {user.email}")

    db_user = users_collection.find_one({"email": user.email})
    if not db_user:
        print(f"❌ User not found: {user.email}")
        raise HTTPException(status_code=400, detail="Invalid email or password")

    print(f"✅ User found")

    if not verify_password(user.password, db_user["password"]):
        print(f"❌ Invalid password")
        raise HTTPException(status_code=400, detail="Invalid email or password")

    print(f"✅ Password verified")

    token = create_access_token({
        "email": db_user["email"],
        "vehicleType": db_user["vehicleType"]
    })

    print(f"✅ Token created")
    print("="*50)

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# =========================
# ROLE BASED ACCESS
# =========================

def require_roles(allowed_roles: list):
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get("vehicleType") not in allowed_roles:
            raise HTTPException(status_code=403, detail="Access forbidden: Insufficient priority")
        return current_user
    return role_checker


@router.get("/high-priority")
def high_priority_route(
    current_user: dict = Depends(require_roles(["ambulance", "fire"]))
):
    return {
        "message": "High priority access granted 🚑🔥",
        "user": current_user
    }


@router.get("/medium-priority")
def medium_priority_route(
    current_user: dict = Depends(require_roles(["ambulance", "fire", "police"]))
):
    return {
        "message": "Medium priority access granted 🚓",
        "user": current_user
    }


@router.get("/general")
def general_route(current_user: dict = Depends(get_current_user)):
    return {
        "message": "General authenticated access 🚗",
        "user": current_user
    }