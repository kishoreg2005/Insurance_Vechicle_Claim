import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Any
from jose import jwt, JWTError
from backend.config import settings

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    if not token:
        return None
    # 1. Try standard HS256 decoding
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        pass

    # 2. Try Firebase ID Token decoding (extract verified/unverified claims)
    try:
        claims = jwt.get_unverified_claims(token)
        if claims and isinstance(claims, dict):
            # Check expiration if present
            exp = claims.get("exp")
            if exp and datetime.utcnow().timestamp() > exp:
                return None
            return claims
    except Exception:
        pass

    return None
