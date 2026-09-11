from types import SimpleNamespace
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from backend.db.firebase_db import firebase_db
from backend.auth.jwt import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    # In Firebase tokens, 'email' is explicitly present, while 'sub' is the Firebase UID
    email = payload.get("email")
    sub = payload.get("sub")
    target_identifier = email or sub
    if not target_identifier:
        raise credentials_exception

    user_data = None
    if email:
        user_data = firebase_db.get_user_by_email(email)
    
    if user_data is None and sub:
        user_data = firebase_db.get_user_by_id(sub)
        if not user_data:
            for u in firebase_db.get_collection("users"):
                if str(u.get("uid")) == str(sub) or str(u.get("id")) == str(sub):
                    user_data = u
                    break

    if user_data is None and email:
        # Dynamically onboard verified Firebase Auth users
        new_role = payload.get("role") or ("admin" if "admin" in str(email).lower() else "user")
        new_user = {
            "name": payload.get("name") or email.split("@")[0].capitalize(),
            "email": email.lower(),
            "role": new_role,
            "uid": sub,
            "is_active": True
        }
        user_data = firebase_db.create_user(new_user)

    if user_data is None:
        raise credentials_exception

    if not user_data.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
    return SimpleNamespace(**user_data)

def require_admin(current_user: SimpleNamespace = Depends(get_current_user)) -> SimpleNamespace:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

def require_user(current_user: SimpleNamespace = Depends(get_current_user)) -> SimpleNamespace:
    return current_user
