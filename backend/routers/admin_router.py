import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from types import SimpleNamespace

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from backend.db.firebase_db import firebase_db
from backend.schemas.claim import ClaimOut, ClaimListResponse, ClaimOverrideRequest
from backend.schemas.policy import PolicyCreate, PolicyOut, PremiumRangeConfigOut, PremiumRangeConfigUpdate
from backend.schemas.config_schemas import (
    CostConfigCreate, CostConfigUpdate, CostConfigOut,
    SeverityConfigUpdate, SeverityConfigOut
)
from backend.schemas.analytics import (
    AnalyticsResponse, DashboardKPIs, StatusItem,
    DamageTypeItem, TimelineItem, CostBracketItem, PartDistributionItem
)
from backend.auth.dependencies import require_admin
from backend.routers.user_router import format_claim_out

router = APIRouter(prefix="/admin", tags=["Admin Operations"], dependencies=[Depends(require_admin)])

class BulkActionRequest(BaseModel):
    action: str  # "approve", "reject", "flag"
    claim_ids: List[int]

class UserStatusUpdate(BaseModel):
    is_active: bool

# ----------------- CLAIMS MANAGEMENT ----------------- #

@router.get("/claims", response_model=ClaimListResponse)
def get_all_claims(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    verdict: Optional[str] = Query(None),
    part: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100)
):
    claims = firebase_db.get_collection("claims")

    if user_id:
        claims = [c for c in claims if str(c.get("user_id")) == str(user_id)]

    if search:
        s = search.lower()
        filtered = []
        for c in claims:
            user = firebase_db.get_user_by_id(c.get("user_id")) or {}
            if (
                s in c.get("claim_number", "").lower() or
                s in c.get("claimed_part", "").lower() or
                s in c.get("claimed_description", "").lower() or
                s in c.get("vehicle_model", "").lower() or
                s in c.get("vehicle_plate", "").lower() or
                s in user.get("name", "").lower() or
                s in user.get("email", "").lower()
            ):
                filtered.append(c)
        claims = filtered

    if status and status.lower() != "all":
        claims = [c for c in claims if c.get("status", "").lower() == status.lower()]

    if verdict and verdict.lower() != "all":
        claims = [c for c in claims if c.get("verdict", "").lower() == verdict.lower()]

    if part and part.lower() != "all":
        claims = [c for c in claims if part.lower() in c.get("claimed_part", "").lower()]

    claims.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    total = len(claims)
    start_idx = (page - 1) * limit
    paginated = claims[start_idx:start_idx + limit]
    formatted = [format_claim_out(c) for c in paginated]

    return ClaimListResponse(total=total, page=page, limit=limit, items=formatted)

@router.get("/claims/{claim_id}", response_model=ClaimOut)
def get_claim_detail(claim_id: int):
    claim = firebase_db.get_claim(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return format_claim_out(claim)

@router.patch("/claims/{claim_id}/override", response_model=ClaimOut)
def override_claim(
    claim_id: int,
    payload: ClaimOverrideRequest,
    current_admin: SimpleNamespace = Depends(require_admin)
):
    claim = firebase_db.get_claim(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    updates = {}
    if payload.status:
        updates["status"] = payload.status
    if payload.override_verdict:
        updates["override_verdict"] = payload.override_verdict
        updates["verdict"] = payload.override_verdict
    if payload.admin_note is not None:
        updates["admin_note"] = payload.admin_note

    updates["override_by"] = current_admin.email
    updates["override_at"] = datetime.utcnow().isoformat()

    updated = firebase_db.update_claim(claim_id, updates)

    firebase_db.log_activity(
        type="override",
        title=f"Claim #{claim.get('claim_number', claim_id)} Overridden",
        description=f"Status: {payload.status or claim.get('status')}, Verdict: {payload.override_verdict or claim.get('verdict')}",
        claim_id=claim_id,
        user_email=current_admin.email
    )

    return format_claim_out(updated)

@router.post("/claims/bulk-action")
def bulk_action(
    payload: BulkActionRequest,
    current_admin: SimpleNamespace = Depends(require_admin)
):
    action_map = {
        "approve": {"status": "Approved", "override_verdict": "Match"},
        "reject": {"status": "Rejected", "override_verdict": "Flagged"},
        "flag": {"status": "Info Requested", "override_verdict": "Flagged"}
    }
    if payload.action.lower() not in action_map:
        raise HTTPException(status_code=400, detail="Invalid action")

    target = action_map[payload.action.lower()]
    count = 0
    for cid in payload.claim_ids:
        claim = firebase_db.get_claim(cid)
        if claim:
            updates = {
                "status": target["status"],
                "override_verdict": target["override_verdict"],
                "verdict": target["override_verdict"],
                "override_by": current_admin.email,
                "override_at": datetime.utcnow().isoformat()
            }
            firebase_db.update_claim(cid, updates)
            count += 1

    return {"message": f"Bulk action '{payload.action}' successfully applied to {count} claim(s)."}

# ----------------- ANALYTICS & DASHBOARD ----------------- #

@router.get("/analytics", response_model=AnalyticsResponse)
def get_dashboard_analytics(days: int = Query(30, ge=1, le=365)):
    claims = firebase_db.get_collection("claims")
    users = firebase_db.get_collection("users")

    total_claims = len(claims)
    pending_count = sum(1 for c in claims if c.get("status") == "Pending")
    approved_count = sum(1 for c in claims if c.get("status") == "Approved")
    rejected_count = sum(1 for c in claims if c.get("status") == "Rejected")
    flagged_count = sum(1 for c in claims if c.get("verdict") == "Flagged")

    auto_match_count = sum(1 for c in claims if c.get("verdict") == "Match")
    match_rate = round((auto_match_count / total_claims * 100), 1) if total_claims > 0 else 92.5
    fraud_rate = round((flagged_count / total_claims * 100), 1) if total_claims > 0 else 7.5

    total_est_payout = sum(float(c.get("estimated_cost_max", 0)) for c in claims)
    avg_est_claim = round(total_est_payout / total_claims, 2) if total_claims > 0 else 0.0

    kpis = DashboardKPIs(
        total_claims=total_claims,
        pending_count=pending_count,
        approved_count=approved_count,
        rejected_count=rejected_count,
        flagged_count=flagged_count,
        auto_match_rate=match_rate,
        potential_fraud_rate=fraud_rate,
        total_estimated_payout=round(total_est_payout, 2),
        avg_claim_cost=avg_est_claim
    )

    status_dist = [
        StatusItem(status="Pending", count=pending_count, color="#f59e0b"),
        StatusItem(status="Approved", count=approved_count, color="#10b981"),
        StatusItem(status="Rejected", count=rejected_count, color="#ef4444"),
        StatusItem(status="Info Requested", count=sum(1 for c in claims if c.get("status") == "Info Requested"), color="#8b5cf6")
    ]

    damage_counts: Dict[str, int] = {}
    for c in claims:
        for d in c.get("detections", []):
            dt = d.get("damage_type", "Other")
            damage_counts[dt] = damage_counts.get(dt, 0) + 1

    damage_type_dist = [
        DamageTypeItem(damage_type=k, count=v, percentage=round(v / max(1, sum(damage_counts.values())) * 100, 1))
        for k, v in damage_counts.items()
    ]
    if not damage_type_dist:
        damage_type_dist = [
            DamageTypeItem(damage_type="Dent", count=14, percentage=42.0),
            DamageTypeItem(damage_type="Scratch", count=10, percentage=30.0),
            DamageTypeItem(damage_type="Crack / Tear", count=6, percentage=18.0),
            DamageTypeItem(damage_type="Severe Impact", count=3, percentage=10.0),
        ]

    part_counts: Dict[str, int] = {}
    for c in claims:
        p = c.get("claimed_part", "Bumper")
        part_counts[p] = part_counts.get(p, 0) + 1

    part_dist = [
        PartDistributionItem(part=k, count=v, percentage=round(v / max(1, sum(part_counts.values())) * 100, 1))
        for k, v in part_counts.items()
    ]

    cost_bracket_dist = [
        CostBracketItem(bracket="< ₹10k", count=sum(1 for c in claims if float(c.get("estimated_cost_max", 0)) < 10000)),
        CostBracketItem(bracket="₹10k - ₹30k", count=sum(1 for c in claims if 10000 <= float(c.get("estimated_cost_max", 0)) < 30000)),
        CostBracketItem(bracket="₹30k - ₹60k", count=sum(1 for c in claims if 30000 <= float(c.get("estimated_cost_max", 0)) < 60000)),
        CostBracketItem(bracket="> ₹60k", count=sum(1 for c in claims if float(c.get("estimated_cost_max", 0)) >= 60000)),
    ]

    recent_flagged = [
        format_claim_out(c) for c in claims if c.get("verdict") == "Flagged"
    ][:5]

    return AnalyticsResponse(
        kpis=kpis,
        status_distribution=status_dist,
        damage_type_distribution=damage_type_dist,
        timeline=[],
        cost_bracket_distribution=cost_bracket_dist,
        part_distribution=part_dist,
        recent_flagged_claims=recent_flagged
    )

# ----------------- USERS MANAGEMENT ----------------- #

@router.get("/users")
def get_all_users():
    users = firebase_db.get_collection("users")
    claims = firebase_db.get_collection("claims")
    result = []
    for u in users:
        c_count = sum(1 for c in claims if str(c.get("user_id")) == str(u.get("id")))
        result.append({
            "id": u.get("id"),
            "name": u.get("name"),
            "email": u.get("email"),
            "role": u.get("role", "user"),
            "is_active": u.get("is_active", True),
            "created_at": u.get("created_at"),
            "claim_count": c_count
        })
    return result

@router.patch("/users/{user_id}/status")
def update_user_status(user_id: int, payload: UserStatusUpdate):
    user = firebase_db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    firebase_db.update_data(f"users/{user_id}", {"is_active": payload.is_active})
    return {"message": f"User status updated to {'active' if payload.is_active else 'deactivated'}."}

# ----------------- COST & SEVERITY CONFIGS ----------------- #

@router.get("/cost-configs", response_model=List[CostConfigOut])
def get_cost_configs():
    return firebase_db.get_collection("cost_configs")

@router.post("/cost-configs", response_model=CostConfigOut)
def create_cost_config(payload: CostConfigCreate):
    configs = firebase_db.get_collection("cost_configs")
    max_id = max([int(c.get("id", 0)) for c in configs if str(c.get("id", 0)).isdigit()] or [0])
    new_id = max_id + 1
    new_data = {
        "id": new_id,
        "part": payload.part,
        "damage_type": payload.damage_type,
        "severity": payload.severity,
        "cost_min": payload.cost_min,
        "cost_max": payload.cost_max
    }
    firebase_db.set_data(f"cost_configs/{new_id}", new_data)
    return new_data

@router.patch("/cost-configs/{config_id}", response_model=CostConfigOut)
def update_cost_config(config_id: int, payload: CostConfigUpdate):
    rule = firebase_db.get_item("cost_configs", config_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Cost rule not found")
    
    updates = {k: v for k, v in payload.dict(exclude_unset=True).items() if v is not None}
    firebase_db.update_data(f"cost_configs/{config_id}", updates)
    return firebase_db.get_item("cost_configs", config_id)

@router.delete("/cost-configs/{config_id}")
def delete_cost_config(config_id: int):
    firebase_db.delete_data(f"cost_configs/{config_id}")
    return {"message": "Rule removed successfully"}

@router.get("/severity-configs", response_model=List[SeverityConfigOut])
def get_severity_configs():
    return firebase_db.get_collection("severity_configs")

@router.patch("/severity-configs/{config_id}", response_model=SeverityConfigOut)
def update_severity_config(config_id: int, payload: SeverityConfigUpdate):
    cfg = firebase_db.get_item("severity_configs", config_id)
    if not cfg:
        raise HTTPException(status_code=404, detail="Severity config not found")
    updates = {k: v for k, v in payload.dict(exclude_unset=True).items() if v is not None}
    firebase_db.update_data(f"severity_configs/{config_id}", updates)
    return firebase_db.get_item("severity_configs", config_id)

# ----------------- POLICY MANAGEMENT ----------------- #

@router.get("/policies", response_model=List[PolicyOut])
def get_all_policies():
    policies = firebase_db.get_collection("policies")
    result = []
    for p in policies:
        user = firebase_db.get_user_by_id(p.get("user_id")) or {}
        result.append({
            "id": p.get("id"),
            "policy_number": p.get("policy_number", f"POL-{p.get('id')}"),
            "user_id": p.get("user_id"),
            "user_name": user.get("name", "Policyholder"),
            "user_email": user.get("email", ""),
            "vehicle_type": p.get("vehicle_type", "Passenger Sedan"),
            "vehicle_model": p.get("vehicle_model", "Hyundai i20"),
            "vehicle_plate": p.get("vehicle_plate", "KA-01-MJ-8821"),
            "coverage_type": p.get("coverage_type", "Comprehensive"),
            "annual_premium": float(p.get("annual_premium", 18500)),
            "monthly_instalment": float(p.get("monthly_instalment", 1650)),
            "start_date": p.get("start_date"),
            "end_date": p.get("end_date"),
            "status": p.get("status", "Active"),
            "created_at": p.get("created_at", datetime.utcnow().isoformat())
        })
    return result

@router.post("/policies", response_model=PolicyOut)
def create_policy(payload: PolicyCreate):
    policies = firebase_db.get_collection("policies")
    max_id = max([int(p.get("id", 0)) for p in policies if str(p.get("id", 0)).isdigit()] or [0])
    new_id = max_id + 1
    pol_data = {
        "id": new_id,
        "policy_number": f"POL-2026-{str(new_id).zfill(4)}",
        "user_id": payload.user_id,
        "vehicle_type": payload.vehicle_type,
        "vehicle_model": payload.vehicle_model,
        "vehicle_plate": payload.vehicle_plate,
        "coverage_type": payload.coverage_type,
        "annual_premium": payload.annual_premium,
        "monthly_instalment": round(payload.annual_premium / 12, 2),
        "start_date": payload.start_date.isoformat() if payload.start_date else datetime.utcnow().isoformat(),
        "end_date": payload.end_date.isoformat() if payload.end_date else (datetime.utcnow() + timedelta(days=365)).isoformat(),
        "status": "Active",
        "created_at": datetime.utcnow().isoformat()
    }
    firebase_db.set_data(f"policies/{new_id}", pol_data)
    user = firebase_db.get_user_by_id(payload.user_id) or {}
    pol_data["user_name"] = user.get("name", "Policyholder")
    pol_data["user_email"] = user.get("email", "")
    return pol_data

@router.get("/premium-configs", response_model=List[PremiumRangeConfigOut])
def get_premium_configs():
    return firebase_db.get_collection("premium_configs")
