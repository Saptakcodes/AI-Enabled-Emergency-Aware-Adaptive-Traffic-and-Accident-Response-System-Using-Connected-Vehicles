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
# SIGNUP
# =========================

@router.post("/signup")
def signup(user: UserSignup):
    print("\n" + "="*50)
    print("🔍 SIGNUP ATTEMPT")
    print("="*50)
    print(f"📧 Email: {user.email}")
    print(f"👤 Name: {user.name}")
    print(f"📊 Database: {users_collection.database.name}")
    print(f"📁 Collection: {users_collection.name}")
    
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
    
    # Insert user - THIS CREATES THE DATABASE IN ATLAS
    try:
        result = users_collection.insert_one(user_dict)
        print(f"✅ SUCCESS! User inserted with ID: {result.inserted_id}")
        
        # Verify insertion
        saved_user = users_collection.find_one({"_id": result.inserted_id})
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

    db_user = users_collection.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email")

    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid password")

    token = create_access_token({
        "email": db_user["email"],
        "vehicleType": db_user["vehicleType"]
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# =========================
# PROTECTED ROUTES
# =========================

@router.get("/protected")
def protected_route(current_user: dict = Depends(get_current_user)):
    return {
        "message": "Access granted",
        "user": current_user
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