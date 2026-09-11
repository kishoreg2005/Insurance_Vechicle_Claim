from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel

class ClaimImageOut(BaseModel):
    id: int
    claim_id: int
    image_path: str
    overlay_image_path: Optional[str] = None
    file_name: str

    class Config:
        from_attributes = True

class DetectionResultOut(BaseModel):
    id: int
    claim_id: int
    part: str
    damage_type: str
    severity: str
    confidence: float
    cost_min: float
    cost_max: float
    bbox_json: Optional[str] = None
    mask_json: Optional[str] = None

    class Config:
        from_attributes = True

class ReportOut(BaseModel):
    id: int
    claim_id: int
    pdf_path: str
    file_name: str
    generated_at: datetime

    class Config:
        from_attributes = True

class ClaimCreate(BaseModel):
    vehicle_model: Optional[str] = "Sedan"
    vehicle_plate: Optional[str] = "MH-12-AB-1234"
    claimed_part: str
    claimed_description: str
    claimed_severity: Optional[str] = "Minor"

class ClaimOverrideRequest(BaseModel):
    status: Optional[str] = None  # "Approved", "Rejected", "Info Requested", "Pending"
    override_verdict: Optional[str] = None  # "Match", "Partial Match", "Flagged"
    admin_note: Optional[str] = None

class UserBrief(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True

class ClaimOut(BaseModel):
    id: int
    claim_number: str
    user_id: int
    vehicle_model: Optional[str] = None
    vehicle_plate: Optional[str] = None
    claimed_part: str
    claimed_description: str
    claimed_severity: str
    status: str
    verdict: str
    match_score: float
    match_summary: Optional[str] = None
    estimated_cost_min: float
    estimated_cost_max: float
    admin_note: Optional[str] = None
    override_verdict: Optional[str] = None
    override_by: Optional[str] = None
    override_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    user: Optional[UserBrief] = None
    images: List[ClaimImageOut] = []
    detections: List[DetectionResultOut] = []
    reports: List[ReportOut] = []

    class Config:
        from_attributes = True

class ClaimListResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[ClaimOut]
