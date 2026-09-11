from types import SimpleNamespace
from fastapi import APIRouter, Depends, HTTPException, status
from backend.db.firebase_db import firebase_db
from backend.schemas.auth import UserCreate, UserLogin, UserOut, Token
from backend.auth.jwt import hash_password, verify_password, create_access_token
from backend.auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register_user(user_in: UserCreate):
    existing = firebase_db.get_user_by_email(user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already registered"
        )
    
    new_user_data = {
        "name": user_in.name,
        "email": user_in.email.lower(),
        "password_hash": hash_password(user_in.password),
        "role": user_in.role or "user",
        "is_active": True
    }
    user_created = firebase_db.create_user(new_user_data)

    token = create_access_token(data={"sub": user_created["email"], "role": user_created["role"]})
    user_out = UserOut(
        id=user_created["id"],
        name=user_created["name"],
        email=user_created["email"],
        role=user_created["role"],
        is_active=user_created["is_active"],
        created_at=user_created["created_at"],
        claim_count=0
    )
    return Token(access_token=token, token_type="bearer", user=user_out)

@router.post("/login", response_model=Token)
def login(login_data: UserLogin):
    user = firebase_db.get_user_by_email(login_data.email)
    if not user or not verify_password(login_data.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support."
        )

    # If role check is specified and user attempts role mismatch
    if login_data.role and user.get("role") != login_data.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Account is not authorized for {login_data.role} portal."
        )

    all_claims = firebase_db.get_collection("claims")
    claim_count = sum(1 for c in all_claims if str(c.get("user_id")) == str(user["id"]))

    token = create_access_token(data={"sub": user["email"], "role": user["role"]})
    user_out = UserOut(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        is_active=user["is_active"],
        created_at=user["created_at"],
        claim_count=claim_count
    )
    return Token(access_token=token, token_type="bearer", user=user_out)

@router.get("/me", response_model=UserOut)
def get_me(current_user: SimpleNamespace = Depends(get_current_user)):
    all_claims = firebase_db.get_collection("claims")
    claim_count = sum(1 for c in all_claims if str(c.get("user_id")) == str(current_user.id))
    return UserOut(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        claim_count=claim_count
    )
