from typing import List, Optional
from pydantic import BaseModel
from backend.schemas.claim import ClaimOut

class DashboardKPIs(BaseModel):
    total_claims: int
    pending_count: int
    approved_count: int
    rejected_count: int
    flagged_count: int
    auto_match_rate: float
    potential_fraud_rate: float
    total_estimated_payout: float
    avg_claim_cost: float

class StatusItem(BaseModel):
    status: str
    count: int
    color: str

class DamageTypeItem(BaseModel):
    damage_type: str
    count: int
    percentage: float

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
    percentage: float

class AnalyticsResponse(BaseModel):
    kpis: DashboardKPIs
    status_distribution: List[StatusItem]
    damage_type_distribution: List[DamageTypeItem]
    timeline: List[TimelineItem]
    cost_bracket_distribution: List[CostBracketItem]
    part_distribution: List[PartDistributionItem]
    recent_flagged_claims: List[ClaimOut]
