from typing import List, Optional
from pydantic import BaseModel
from backend.schemas.claim import ClaimOut

class DashboardKPIs(BaseModel):
    total_claims: int
    flagged_count: int
    flagged_percentage: float
    avg_processing_time: str
    total_cost_estimated: float
    pending_count: int
    approved_count: int
    rejected_count: int

class StatusItem(BaseModel):
    status: str
    count: int
    color: str

class DamageTypeItem(BaseModel):
    damage_type: str
    count: int

class TimelineItem(BaseModel):
    date: str
    claims: int
    flagged: int

class CostBracketItem(BaseModel):
    bracket: str
    count: int

class PartDistributionItem(BaseModel):
    part: str
    count: int

class AnalyticsResponse(BaseModel):
    kpis: DashboardKPIs
    claims_by_status: List[StatusItem]
    damage_type_distribution: List[DamageTypeItem]
    claims_timeline: List[TimelineItem]
    cost_bracket_distribution: List[CostBracketItem]
    part_distribution: List[PartDistributionItem]
    recent_flagged_claims: List[ClaimOut]
