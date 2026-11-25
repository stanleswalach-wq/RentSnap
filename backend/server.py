import asyncio
import os
import uuid
import logging
from contextlib import suppress
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional

import bcrypt
import jwt
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from fastapi import Depends, FastAPI, APIRouter, HTTPException, Request, Response
from fastapi.responses import Response as RawResponse
from pydantic import BaseModel, ConfigDict, Field, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING, IndexModel
from starlette.middleware.cors import CORSMiddleware
import secrets

from pdf_documents import (
    generate_deposit_pdf,
    generate_lease_pdf,
    generate_protocol_pdf,
    generate_utilities_pdf,
)

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

INDEXES = {
    "users": [IndexModel([("email", ASCENDING)], name="email", unique=True)],
    "properties": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)], name="user_created"),
    ],
    "leads": [IndexModel([("created_at", DESCENDING)], name="created_desc")],
    "login_attempts": [IndexModel([("identifier", ASCENDING)], name="identifier")],
}

async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:
                logging.getLogger(__name__).error("ensure_indexes(%s.%s): %s", collection, model.document["name"], exc)

# Inicjalizacja aplikacji FastAPI
app = FastAPI()

# NAPRAWIONY CORS - musi być dodany zaraz po utworzeniu app, przed routami!
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

# ---------------- Auth ----------------

class RegisterIn(BaseModel):
    name: str
    email: str
    password: str

class LoginIn(BaseModel):
    email: str
    password: str

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def _set_auth_cookies(response: Response, user_id: str, email: str) -> None:
    response.set_cookie("access_token", create_access_token(user_id, email),
                        httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie("refresh_token", create_refresh_token(user_id),
                        httponly=True, secure=True, samesite="none", max_age=604800, path="/")

@api_router.post("/auth/register")
async def register(data: RegisterIn, response: Response):
    email = data.email.strip().lower()
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Hasło musi mieć min. 6 znaków")
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Ten adres e-mail jest już zajęty")
    user = {
        "id": str(uuid.uuid4()),
        "name": data.name.strip(),
        "email": email,
        "password_hash": hash_password(data.password),
        "role": "user",
        "plan": "trial",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user)
    _set_auth_cookies(response, user["id"], email)
    return {k: v for k, v in user.items() if k not in ("password_hash", "_id")}

@api_router.post("/auth/login")
async def login(data: LoginIn, request: Request, response: Response):
    email = data.email.strip().lower()
    identifier = f"{request.client.host if request.client else 'unknown'}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        locked_until = attempt.get("locked_until")
        if locked_until and datetime.fromisoformat(locked_until) > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Zbyt wiele prób logowania. Spróbuj za 15 minut.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1},
             "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Nieprawidłowy e-mail lub hasło")
    await db.login_attempts.delete_one({"identifier": identifier})
    _set_auth_cookies(response, user["id"], email)
    return {k: v for k, v in user.items() if k not in ("password_hash", "_id")}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}

@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    response.set_cookie("access_token", create_access_token(user["id"], user["email"]),
                        httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    return {"ok": True}

# ---------------- Leads (landing form) ----------------

class LeadIn(BaseModel):
    name: str
    email: str
    user_type: str
    message: Optional[str] = ""

@api_router.post("/leads")
async def create_lead(data: LeadIn):
    doc = {
        "id": str(uuid.uuid4()),
        "name": data.name.strip(),
        "email": data.email.strip().lower(),
        "user_type": data.user_type,
        "message": (data.message or "").strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.leads.insert_one(doc)
    return {"ok": True, "id": doc["id"]}

# ---------------- Properties ----------------

class PropertyIn(BaseModel):
    address: str
    tenant: Optional[str] = ""
    rent: Optional[str] = "0"

class PropertyOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    address: str
    tenant: str
    rent: str
    created_at: str

@api_router.get("/properties", response_model=List[PropertyOut])
async def list_properties(user: dict = Depends(get_current_user)):
    docs = await db.properties.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs

@api_router.post("/properties", response_model=PropertyOut)
async def create_property(data: PropertyIn, user: dict = Depends(get_current_user)):
    if not data.address.strip():
        raise HTTPException(status_code=400, detail="Adres lokalu jest wymagany")
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "address": data.address.strip(),
        "tenant": data.tenant.strip() if data.tenant else "Brak najemcy",
        "rent": data.rent.strip() if data.rent else "0",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.properties.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "user_id"}

@api_router.delete("/properties/{prop_id}")
async def delete_property(prop_id: str, user: dict = Depends(get_current_user)):
    result = await db.properties.delete_one({"id": prop_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Nie znaleziono lokalu")
    return {"ok": True}

# ---------------- PDF generators ----------------

def pdf_response(pdf_bytes: bytes, filename: str) -> RawResponse:
    return RawResponse(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

class LeaseIn(BaseModel):
    occasional: bool = False
    city: str = ""
    date: str = ""
    address: str = ""
    area: str = ""
    landlord_name: str = ""
    landlord_id: str = ""
    tenant_name: str = ""
    tenant_id: str = ""
    rent_amount: str = ""
    deposit_amount: str = ""
    payment_day: str = ""
    start_date: str = ""
    end_date: str = ""
    alt_address: str = ""
    alt_owner: str = ""
    smoking_penalty: str = "1000"
    clauses: dict = Field(default_factory=dict)
    custom_texts: Optional[dict] = Field(default_factory=dict)
    landlord_signature: Optional[str] = None
    tenant_signature: Optional[str] = None

@api_router.post("/documents/lease")
async def lease_pdf(data: LeaseIn, user: dict = Depends(get_current_user)):
    pdf = generate_lease_pdf(data.model_dump())
    return pdf_response(pdf, "umowa-najmu.pdf")

class DepositIn(BaseModel):
    city: str = ""
    date: str = ""
    address: str = ""
    landlord_name: str = ""
    tenant_name: str = ""
    amount: str = ""
    method: str = "Przelew bankowy"
    signature: Optional[str] = None

@api_router.post("/documents/deposit")
async def deposit_pdf(data: DepositIn, user: dict = Depends(get_current_user)):
    pdf = generate_deposit_pdf(data.model_dump())
    return pdf_response(pdf, "potwierdzenie-kaucji.pdf")

class ProtocolIn(BaseModel):
    city: str = ""
    date: str = ""
    contract_ref: str = ""
    address: str = ""
    area: str = ""
    rooms: str = ""
    landlord_name: str = ""
    landlord_id: str = ""
    tenant_name: str = ""
    tenant_id: str = ""
    elec_num: str = ""
    elec_val: str = ""
    water_cold_num: str = ""
    water_cold_val: str = ""
    water_hot_num: str = ""
    water_hot_val: str = ""
    gas_num: str = ""
    gas_val: str = ""
    heating_val: str = ""
    walls: str = ""
    floors: str = ""
    doors_windows: str = ""
    defects: str = ""
    furniture: str = ""
    appliances: str = ""
    keys_count: str = ""
    remotes_count: str = ""
    access_codes: str = ""
    photos: List[str] = Field(default_factory=list)
    landlord_signature: Optional[str] = None
    tenant_signature: Optional[str] = None

@api_router.post("/documents/protocol")
async def protocol_pdf(data: ProtocolIn, user: dict = Depends(get_current_user)):
    pdf = generate_protocol_pdf(data.model_dump())
    return pdf_response(pdf, "protokol-zdawczo-odbiorczy.pdf")

class UtilitiesIn(BaseModel):
    city: str = ""
    date: str = ""
    address: str = ""
    tenant_name: str = ""
    elec_start: str = ""
    elec_end: str = ""
    elec_rate: str = "1.20"
    water_start: str = ""
    water_end: str = ""
    water_rate: str = "15.50"
    gas_start: str = ""
    gas_end: str = ""
    gas_rate: str = "3.50"
    landlord_signature: Optional[str] = None  
    tenant_signature: Optional[str] = None   

@api_router.post("/documents/utilities")
async def utilities_pdf(data: UtilitiesIn, user: dict = Depends(get_current_user)):
    pdf = generate_utilities_pdf(data.model_dump())
    return pdf_response(pdf, "rozliczenie-mediow.pdf")

# ---------------- Forgot Password ----------------

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

@api_router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    reset_token = secrets.token_urlsafe(32)
    print(f"Link resetujący dla {data.email}: http://localhost:3000/reset-password?token={reset_token}")
    return {
        "status": "success",
        "message": "Jeśli podany e-mail istnieje w bazie, wysłano instrukcję resetowania."
    }

@api_router.get("/")
async def root():
    return {"message": "LOKUM.PDF API"}

# Podpięcie routera pod główną aplikację
app.include_router(api_router)

# Konfiguracja logowania systemowego
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def start_index_build():
    app.state.index_task = asyncio.create_task(ensure_indexes())

@app.on_event("shutdown")
async def shutdown_db_client():
    app.state.index_task.cancel()
    with suppress(asyncio.CancelledError):
        await app.state.index_task
    client.close()