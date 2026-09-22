import os
import shutil
import json
import uuid
from types import SimpleNamespace
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.responses import FileResponse

from backend.config import settings
from backend.db.firebase_db import firebase_db
from backend.schemas.claim import ClaimOut, ClaimListResponse
from backend.auth.dependencies import get_current_user
from backend.services.cv_engine import analyze_and_annotate_image
from backend.services.severity_service import compute_overall_severity
from backend.services.cost_service import estimate_total_claim_cost
from backend.services.cross_check import cross_check_claim
from backend.services.pdf_service import generate_pdf_report

router = APIRouter(prefix="/user", tags=["User Operations"])

def format_claim_out(c: dict) -> dict:
    user_data = firebase_db.get_user_by_id(c.get("user_id"))
    user_brief = {
        "id": user_data.get("id"),
        "name": user_data.get("name", "Policyholder"),
        "email": user_data.get("email", "")
    } if user_data else None

    return {
        "id": int(c.get("id", 1)),
        "claim_number": c.get("claim_number", f"CLM-{c.get('id')}"),
        "user_id": int(c.get("user_id", 1)),
        "vehicle_model": c.get("vehicle_model", "Sedan"),
        "vehicle_plate": c.get("vehicle_plate", "Unknown"),
        "claimed_part": c.get("claimed_part", "Exterior Panel"),
        "claimed_description": c.get("claimed_description", ""),
        "claimed_severity": c.get("claimed_severity", "Minor"),
        "status": c.get("status", "Pending"),
        "verdict": c.get("verdict", "Match"),
        "match_score": float(c.get("match_score", 0.0)),
        "match_summary": c.get("match_summary", ""),
        "estimated_cost_min": float(c.get("estimated_cost_min", 0.0)),
        "estimated_cost_max": float(c.get("estimated_cost_max", 0.0)),
        "admin_note": c.get("admin_note"),
        "override_verdict": c.get("override_verdict"),
        "override_by": c.get("override_by"),
        "override_at": c.get("override_at"),
        "created_at": c.get("created_at", datetime.utcnow().isoformat()),
        "updated_at": c.get("updated_at", datetime.utcnow().isoformat()),
        "user": user_brief,
        "images": c.get("images", []),
        "detections": c.get("detections", []),
        "reports": c.get("reports", [])
    }

@router.post("/assess", response_model=ClaimOut)
async def assess_claim(
    claimed_part: str = Form(...),
    claimed_description: str = Form(...),
    claimed_severity: str = Form("Minor"),
    vehicle_model: str = Form("Sedan"),
    vehicle_plate: str = Form("MH-12-AB-1234"),
    images: List[UploadFile] = File(...),
    current_user: SimpleNamespace = Depends(get_current_user)
):
    if not images:
        raise HTTPException(status_code=400, detail="At least one vehicle damage image is required.")

    claim_num = f"CLM-{datetime.utcnow().year}-{str(uuid.uuid4())[:8].upper()}"
    saved_images_info = []
    all_detections = []

    for idx, file in enumerate(images):
        ext = os.path.splitext(file.filename)[1].lower() or ".jpg"
        unique_base = f"{uuid.uuid4().hex}"
        filename = f"{unique_base}{ext}"
        orig_file_path = settings.UPLOAD_DIR / filename
        overlay_filename = f"overlay_{unique_base}{ext}"
        overlay_file_path = settings.UPLOAD_DIR / overlay_filename

        with open(orig_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        detected_items = analyze_and_annotate_image(
            image_path=str(orig_file_path),
            output_overlay_path=str(overlay_file_path),
            claimed_part=claimed_part,
            claimed_description=claimed_description
        )

        saved_images_info.append({
            "id": idx + 1,
            "claim_id": 0,
            "original": f"/uploads/{filename}",
            "overlay": f"/uploads/{overlay_filename}",
            "orig_abs": str(orig_file_path),
            "overlay_abs": str(overlay_file_path),
            "image_path": f"/uploads/{filename}",
            "overlay_image_path": f"/uploads/{overlay_filename}",
            "file_name": file.filename
        })
        all_detections.extend(detected_items)

    overall_detected_sev = compute_overall_severity(all_detections)
    cost_min, cost_max, enriched_detections = estimate_total_claim_cost(all_detections)

    cross_check_res = cross_check_claim(
        claimed_part=claimed_part,
        claimed_description=claimed_description,
        claimed_severity=claimed_severity,
        detected_damages=enriched_detections,
        overall_detected_severity=overall_detected_sev
    )

    verdict = cross_check_res["verdict"]
    match_score = cross_check_res["match_score"]
    match_summary = cross_check_res["summary"]
    initial_status = "Pending"

    detections_formatted = []
    for d_idx, det in enumerate(enriched_detections):
        detections_formatted.append({
            "id": d_idx + 1,
            "claim_id": 0,
            "part": det.get("part", "Exterior Panel"),
            "damage_type": det.get("damage_type", "Dent"),
            "severity": det.get("severity", "Minor"),
            "confidence": float(det.get("confidence", 0.92)),
            "cost_min": float(det.get("cost_min", 0.0)),
            "cost_max": float(det.get("cost_max", 0.0)),
            "bbox_json": json.dumps(det.get("bbox", [])),
            "mask_json": json.dumps(det.get("mask_polygon", []))
        })

    claim_data = {
        "claim_number": claim_num,
        "user_id": current_user.id,
        "vehicle_model": vehicle_model,
        "vehicle_plate": vehicle_plate,
        "claimed_part": claimed_part,
        "claimed_description": claimed_description,
        "claimed_severity": claimed_severity,
        "status": initial_status,
        "verdict": verdict,
        "match_score": match_score,
        "match_summary": match_summary,
        "estimated_cost_min": cost_min,
        "estimated_cost_max": cost_max,
        "admin_note": None,
        "images": saved_images_info,
        "detections": detections_formatted,
        "reports": []
    }

    created_claim = firebase_db.create_claim(claim_data)
    claim_id = created_claim["id"]

    for img in saved_images_info:
        img["claim_id"] = claim_id
    for det in detections_formatted:
        det["claim_id"] = claim_id

    # Generate PDF Report
    first_orig_abs = saved_images_info[0]["orig_abs"] if saved_images_info else None
    first_overlay_abs = saved_images_info[0]["overlay_abs"] if saved_images_info else None

    pdf_abs_path = generate_pdf_report(
        claim_id=claim_id,
        claim_number=claim_num,
        user_name=current_user.name,
        user_email=current_user.email,
        vehicle_model=vehicle_model,
        vehicle_plate=vehicle_plate,
        claimed_part=claimed_part,
        claimed_description=claimed_description,
        claimed_severity=claimed_severity,
        verdict=verdict,
        match_score=match_score,
        match_summary=match_summary,
        cost_min=cost_min,
        cost_max=cost_max,
        detections=enriched_detections,
        original_image_path=first_orig_abs,
        overlay_image_path=first_overlay_abs
    )

    pdf_rel_path = f"/reports/{os.path.basename(pdf_abs_path)}"
    reports_info = [{
        "id": 1,
        "claim_id": claim_id,
        "pdf_path": pdf_rel_path,
        "file_name": os.path.basename(pdf_abs_path),
        "generated_at": datetime.utcnow().isoformat()
    }]
    
    created_claim["images"] = saved_images_info
    created_claim["detections"] = detections_formatted
    created_claim["reports"] = reports_info
    firebase_db.update_claim(claim_id, created_claim)

    return format_claim_out(created_claim)

@router.get("/claims", response_model=ClaimListResponse)
def get_user_claims(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    verdict: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: SimpleNamespace = Depends(get_current_user)
):
    all_claims = firebase_db.get_collection("claims")
    user_claims = [c for c in all_claims if str(c.get("user_id")) == str(current_user.id)]

    if search:
        s = search.lower()
        user_claims = [
            c for c in user_claims if (
                s in c.get("claim_number", "").lower() or
                s in c.get("claimed_part", "").lower() or
                s in c.get("claimed_description", "").lower() or
                s in c.get("vehicle_model", "").lower()
            )
        ]

    if status and status.lower() != "all":
        user_claims = [c for c in user_claims if c.get("status", "").lower() == status.lower()]

    if verdict and verdict.lower() != "all":
        user_claims = [c for c in user_claims if c.get("verdict", "").lower() == verdict.lower()]

    user_claims.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    total = len(user_claims)
    start_idx = (page - 1) * limit
    paginated = user_claims[start_idx:start_idx + limit]
    formatted = [format_claim_out(c) for c in paginated]

    return ClaimListResponse(total=total, page=page, limit=limit, items=formatted)

@router.get("/claims/{claim_id}", response_model=ClaimOut)
def get_user_claim_detail(
    claim_id: int,
    current_user: SimpleNamespace = Depends(get_current_user)
):
    claim = firebase_db.get_claim(claim_id)
    if not claim or str(claim.get("user_id")) != str(current_user.id):
        raise HTTPException(status_code=404, detail="Claim not found")
    return format_claim_out(claim)

@router.get("/claims/{claim_id}/report")
def download_claim_report(
    claim_id: int,
    current_user: SimpleNamespace = Depends(get_current_user)
):
    claim = firebase_db.get_claim(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    if str(claim.get("user_id")) != str(current_user.id) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    reports = claim.get("reports", [])
    if not reports:
        raise HTTPException(status_code=404, detail="Assessment report PDF has not been generated yet.")

    report = reports[-1]
    pdf_file_path = settings.REPORTS_DIR / report.get("file_name", "")
    if not pdf_file_path.exists():
        raise HTTPException(status_code=404, detail="Report file not found on server")

    return FileResponse(
        path=str(pdf_file_path),
        filename=report.get("file_name", "report.pdf"),
        media_type="application/pdf"
    )

@router.get("/policy")
def get_user_policy(
    current_user: SimpleNamespace = Depends(get_current_user)
):
    policies = firebase_db.get_collection("policies")
    user_uid = str(getattr(current_user, "uid", "") or "")
    user_id_str = str(getattr(current_user, "id", "") or "")
    user_email = str(getattr(current_user, "email", "") or "").lower()

    user_policies = [
        p for p in policies
        if (user_id_str and str(p.get("user_id")) == user_id_str)
        or (user_uid and str(p.get("user_id")) == user_uid)
        or (user_email and str(p.get("user_email", "")).lower() == user_email)
    ]
    
    active_policy = next((p for p in user_policies if p.get("status") == "Active"), None)
    if not active_policy and user_policies:
        active_policy = user_policies[0]

    if not active_policy:
        return {"has_policy": False, "policy": None}

    return {
        "has_policy": True,
        "policy": {
            "id": active_policy.get("id"),
            "policy_number": active_policy.get("policy_number", "POL-2026-001"),
            "vehicle_type": active_policy.get("vehicle_type", "Passenger Sedan"),
            "vehicle_model": active_policy.get("vehicle_model", "Vehicle"),
            "vehicle_plate": active_policy.get("vehicle_plate", "N/A"),
            "vehicle_year": active_policy.get("vehicle_year", "2024"),
            "chassis_number": active_policy.get("chassis_number", "N/A"),
            "fuel_type": active_policy.get("fuel_type", "Petrol"),
            "coverage_type": active_policy.get("coverage_type", "Comprehensive"),
            "coverage_amount": active_policy.get("coverage_amount", "₹ 8,50,000"),
            "annual_premium": active_policy.get("annual_premium", 18500),
            "monthly_instalment": active_policy.get("monthly_instalment", 1650),
            "start_date": active_policy.get("start_date"),
            "end_date": active_policy.get("end_date"),
            "status": active_policy.get("status", "Active"),
            "user_name": active_policy.get("user_name", getattr(current_user, "name", "Policyholder")),
            "user_email": active_policy.get("user_email", getattr(current_user, "email", ""))
        }
    }

@router.post("/claims/{claim_id}/reassess", response_model=ClaimOut)
async def reassess_claim(
    claim_id: int,
    images: List[UploadFile] = File(...),
    current_user: SimpleNamespace = Depends(get_current_user)
):
    claim = firebase_db.get_claim(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if str(claim.get("user_id")) != str(current_user.id) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    saved_images_info = []
    all_detections = []

    for idx, file in enumerate(images):
        ext = os.path.splitext(file.filename)[1].lower() or ".jpg"
        unique_base = f"{uuid.uuid4().hex}"
        filename = f"{unique_base}{ext}"
        orig_file_path = settings.UPLOAD_DIR / filename
        overlay_filename = f"overlay_{unique_base}{ext}"
        overlay_file_path = settings.UPLOAD_DIR / overlay_filename

        with open(orig_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        detected_items = analyze_and_annotate_image(
            image_path=str(orig_file_path),
            output_overlay_path=str(overlay_file_path),
            claimed_part=claim.get("claimed_part", "Exterior Panel"),
            claimed_description=claim.get("claimed_description", "")
        )

        saved_images_info.append({
            "id": idx + 1,
            "claim_id": claim_id,
            "image_path": f"/uploads/{filename}",
            "overlay_image_path": f"/uploads/{overlay_filename}",
            "orig_abs": str(orig_file_path),
            "overlay_abs": str(overlay_file_path),
            "file_name": file.filename
        })
        all_detections.extend(detected_items)

    overall_detected_sev = compute_overall_severity(all_detections)
    cost_min, cost_max, enriched_detections = estimate_total_claim_cost(all_detections)

    cross_check_res = cross_check_claim(
        claimed_part=claim.get("claimed_part", "Exterior Panel"),
        claimed_description=claim.get("claimed_description", ""),
        claimed_severity=claim.get("claimed_severity", "Minor"),
        detected_damages=enriched_detections,
        overall_detected_severity=overall_detected_sev
    )

    verdict = cross_check_res["verdict"]
    match_score = cross_check_res["match_score"]
    match_summary = cross_check_res["summary"]

    detections_formatted = []
    for d_idx, d in enumerate(enriched_detections):
        detections_formatted.append({
            "id": d_idx + 1,
            "claim_id": claim_id,
            "part": d.get("part", "Exterior Panel"),
            "damage_type": d.get("damage_type", "Dent"),
            "severity": d.get("severity", "Minor"),
            "confidence": float(d.get("confidence", 0.85)),
            "cost_min": float(d.get("cost_min", 0.0)),
            "cost_max": float(d.get("cost_max", 0.0)),
            "bbox_json": json.dumps(d.get("bbox", [])),
            "mask_json": json.dumps(d.get("polygon_mask", []))
        })

    first_orig = saved_images_info[0]["orig_abs"] if saved_images_info else None
    first_overlay = saved_images_info[0]["overlay_abs"] if saved_images_info else None
    pdf_abs = generate_pdf_report(
        claim_id=claim_id,
        claim_number=claim.get("claim_number", f"CLM-{claim_id}"),
        user_name=current_user.name,
        user_email=current_user.email,
        vehicle_model=claim.get("vehicle_model", "Sedan"),
        vehicle_plate=claim.get("vehicle_plate", "Unknown"),
        claimed_part=claim.get("claimed_part", "Exterior Panel"),
        claimed_description=claim.get("claimed_description", ""),
        claimed_severity=claim.get("claimed_severity", "Minor"),
        verdict=verdict,
        match_score=match_score,
        match_summary=match_summary,
        cost_min=cost_min,
        cost_max=cost_max,
        detections=enriched_detections,
        original_image_path=first_orig,
        overlay_image_path=first_overlay
    )

    reports_info = [{
        "id": 1,
        "claim_id": claim_id,
        "pdf_path": f"/reports/{os.path.basename(pdf_abs)}",
        "file_name": os.path.basename(pdf_abs),
        "generated_at": datetime.utcnow().isoformat()
    }]

    claim["images"] = saved_images_info
    claim["detections"] = detections_formatted
    claim["reports"] = reports_info
    claim["estimated_cost_min"] = cost_min
    claim["estimated_cost_max"] = cost_max
    claim["verdict"] = verdict
    claim["match_score"] = match_score
    claim["match_summary"] = match_summary

    updated = firebase_db.update_claim(claim_id, claim)
    return format_claim_out(updated)
