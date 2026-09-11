from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class PolicyCreate(BaseModel):
    user_id: int
    vehicle_type: str = "Car"  # "Car" or "Bike"
    vehicle_model: str
    vehicle_plate: str
    coverage_type: str = "Comprehensive"  # "Third-party" or "Comprehensive"
    annual_premium: float
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class PolicyOut(BaseModel):
    id: int
    policy_number: str
    user_id: int
    vehicle_type: str
    vehicle_model: str
    vehicle_plate: str
    coverage_type: str
    annual_premium: float
    monthly_instalment: float
    start_date: datetime
    end_date: datetime
    status: str
    created_at: datetime
    user_name: Optional[str] = None
    user_email: Optional[str] = None

    class Config:
        from_attributes = True

class PremiumRangeConfigOut(BaseModel):
    id: int
    vehicle_type: str
    coverage_type: str
    min_annual_premium: float
    max_annual_premium: float
    default_annual_premium: float

    class Config:
        from_attributes = True

class PremiumRangeConfigUpdate(BaseModel):
    min_annual_premium: float
    max_annual_premium: float
    default_annual_premium: float
