# backend/auth.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import users_collection
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
# CREATE TEST USER (startup event)
# =========================
@router.on_event("startup")
async def create_test_user():
    try:
        # Check if test user exists
        test_user = await users_collection.find_one({"email": "test@example.com"})
        if not test_user:
            # Create test user with Literal type matching your model
            test_user_data = {
                "name": "Test User",
                "email": "test@example.com",
                "phone": "1234567890",
                "vehicleNumber": "TEST001",
                "vehicleType": "normal",  # Matches Literal["normal", "ambulance", "police", "fire"]
                "password": pwd_context.hash("password123"),
                "created_at": datetime.utcnow()
            }
            await users_collection.insert_one(test_user_data)
            print("✅ Test user created: test@example.com / password123")
        else:
            print("✅ Test user already exists")
            
        # Create email index if it doesn't exist
        await users_collection.create_index("email", unique=True)
        print("✅ Email index verified")
        
    except Exception as e:
        print(f"⚠️ Startup warning: {e}")


# =========================
# SIGNUP
# =========================

@router.post("/signup")
async def signup(user: UserSignup):  # Using your model with Literal
    print("\n" + "="*50)
    print("🔍 SIGNUP ATTEMPT")
    print("="*50)
    print(f"📧 Email: {user.email}")
    print(f"👤 Name: {user.name}")
    print(f"🚗 Vehicle Type: {user.vehicleType}")  # Will show normal/ambulance/police/fire
    
    try:
        # Check if user exists
        existing_user = await users_collection.find_one({"email": user.email})
        if existing_user:
            print(f"❌ User already exists: {user.email}")
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password
        hashed_password = hash_password(user.password)
        
        # Create user dict with fields matching your model
        user_dict = {
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "vehicleNumber": user.vehicleNumber,
            "vehicleType": user.vehicleType,  # Will be one of: normal, ambulance, police, fire
            "password": hashed_password,
            "created_at": datetime.utcnow()
        }
        
        print(f"📝 Creating user: {user.email} ({user.vehicleType})")
        
        # Insert user
        result = await users_collection.insert_one(user_dict)
        print(f"✅ SUCCESS! User inserted with ID: {result.inserted_id}")
        
        # Verify insertion
        saved_user = await users_collection.find_one({"email": user.email})
        if saved_user:
            print(f"✅ Verified: User found in database")
            total_users = await users_collection.count_documents({})
            print(f"📊 Database now has {total_users} total users")
        else:
            print(f"❌ ERROR: User not found after insertion!")
            
        return {"message": "User registered successfully", "id": str(result.inserted_id)}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERROR inserting user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# =========================
# LOGIN
# =========================

@router.post("/login")
async def login(user: UserLogin):
    print("\n" + "="*50)
    print("🔍 LOGIN ATTEMPT")
    print("="*50)
    print(f"📧 Email: {user.email}")

    try:
        db_user = await users_collection.find_one({"email": user.email})
        if not db_user:
            print(f"❌ User not found: {user.email}")
            raise HTTPException(status_code=400, detail="Invalid email or password")

        print(f"✅ User found: {db_user.get('name')} ({db_user.get('vehicleType')})")

        if not verify_password(user.password, db_user["password"]):
            print(f"❌ Invalid password")
            raise HTTPException(status_code=400, detail="Invalid email or password")

        print(f"✅ Password verified")

        token = create_access_token({
            "email": db_user["email"],
            "vehicleType": db_user["vehicleType"],
            "name": db_user.get("name", "")
        })

        print(f"✅ Token created")
        print("="*50)

        return {
            "access_token": token,
            "token_type": "bearer",
            "user_role": db_user.get("vehicleType", "normal"),
            "user_name": db_user.get("name", "")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")


# =========================
# ROLE BASED ACCESS
# =========================

def require_roles(allowed_roles: list):
    def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("vehicleType")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=403, 
                detail=f"Access forbidden: Required roles {allowed_roles}, but user has {user_role}"
            )
        return current_user
    return role_checker


@router.get("/high-priority")
async def high_priority_route(
    current_user: dict = Depends(require_roles(["ambulance", "fire"]))
):
    return {
        "message": "High priority access granted 🚑🔥",
        "user": {
            "email": current_user.get("email"),
            "role": current_user.get("vehicleType"),
            "name": current_user.get("name")
        }
    }


@router.get("/medium-priority")
async def medium_priority_route(
    current_user: dict = Depends(require_roles(["ambulance", "fire", "police"]))
):
    return {
        "message": "Medium priority access granted 🚓",
        "user": {
            "email": current_user.get("email"),
            "role": current_user.get("vehicleType"),
            "name": current_user.get("name")
        }
    }


@router.get("/general")
async def general_route(current_user: dict = Depends(get_current_user)):
    return {
        "message": "General authenticated access 🚗",
        "user": {
            "email": current_user.get("email"),
            "role": current_user.get("vehicleType"),
            "name": current_user.get("name")
        }
    }


# =========================
# GET CURRENT USER INFO
# =========================

@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return {
        "email": current_user.get("email"),
        "role": current_user.get("vehicleType"),
        "name": current_user.get("name")
    }


# =========================
# HEALTH CHECK
# =========================
@router.get("/health")
async def health_check():
    try:
        # Test database connection
        count = await users_collection.count_documents({})
        return {
            "status": "healthy",
            "database": "connected",
            "users_count": count,
            "using_mongodb": True
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }