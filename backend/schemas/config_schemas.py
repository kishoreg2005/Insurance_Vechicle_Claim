from typing import Optional
from pydantic import BaseModel

class CostConfigBase(BaseModel):
    part: str
    damage_type: str
    severity: str
    cost_min: float
    cost_max: float

class CostConfigCreate(CostConfigBase):
    pass

class CostConfigUpdate(BaseModel):
    part: Optional[str] = None
    damage_type: Optional[str] = None
    severity: Optional[str] = None
    cost_min: Optional[float] = None
    cost_max: Optional[float] = None

class CostConfigOut(CostConfigBase):
    id: int

    class Config:
        from_attributes = True

class SeverityConfigBase(BaseModel):
    damage_type: str
    weight: float
    area_threshold_minor: float
    area_threshold_moderate: float

class SeverityConfigCreate(SeverityConfigBase):
    pass

class SeverityConfigUpdate(BaseModel):
    weight: Optional[float] = None
    area_threshold_minor: Optional[float] = None
    area_threshold_moderate: Optional[float] = None

class SeverityConfigOut(SeverityConfigBase):
    id: int

    class Config:
        from_attributes = True
