from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class UserBase(BaseModel):
    name: str
    email: str

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "user"

class UserLogin(BaseModel):
    email: str
    password: str
    role: Optional[str] = None

class UserOut(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime
    claim_count: Optional[int] = 0

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
