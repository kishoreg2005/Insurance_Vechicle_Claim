import re
from typing import List, Dict, Any

def normalize_text(text: str) -> str:
    return re.sub(r'[^a-zA-Z0-9\s]', ' ', text.lower())

def cross_check_claim(
    claimed_part: str,
    claimed_description: str,
    claimed_severity: str,
    detected_damages: List[Dict[str, Any]],
    overall_detected_severity: str
) -> Dict[str, Any]:
    """
    Evaluates claimed damage details against computer-vision detected damages.
    Returns match_score (0-100), verdict ('Match', 'Partial Match', 'Flagged'),
    and a structured comparison.
    """
    claimed_combined = normalize_text(f"{claimed_part} {claimed_description}")
    words = set(w for w in claimed_combined.split() if len(w) > 2)

    if not detected_damages:
        return {
            "match_score": 20.0,
            "verdict": "Flagged",
            "summary": "AI detected no visible damage corresponding to the claimed incident. Manual surveyor inspection advised.",
            "part_match": False,
            "severity_match": False,
            "matched_damages": [],
            "unclaimed_damages": [],
            "missing_claims": [claimed_part] if claimed_part else []
        }

    # Part & Type Matching
    matched_items = []
    unclaimed_items = []
    total_detected = len(detected_damages)
    
    part_match_points = 0.0
    type_match_points = 0.0

    detected_parts = set()

    for item in detected_damages:
        p_name = item.get("part", "").lower()
        d_type = item.get("damage_type", "").lower()
        detected_parts.add(p_name)

        p_words = set(p_name.split())
        dt_words = set(d_type.split())

        has_part_match = bool(p_words & words) or any(w in claimed_combined for w in p_words)
        has_type_match = bool(dt_words & words) or any(w in claimed_combined for w in dt_words)

        if has_part_match or has_type_match:
            matched_items.append(item)
            if has_part_match:
                part_match_points += 1.0
            if has_type_match:
                type_match_points += 0.5
        else:
            unclaimed_items.append(item)

    # Calculate score components
    # 1. Part alignment (50% max)
    part_score = min(50.0, (part_match_points / max(1, total_detected)) * 50.0)
    
    # 2. Damage type alignment (30% max)
    type_score = min(30.0, (type_match_points / max(1, total_detected)) * 30.0)
    
    # 3. Severity alignment (20% max)
    sev_claim_clean = claimed_severity.strip().lower()
    sev_det_clean = overall_detected_severity.strip().lower()
    
    severity_match = (sev_claim_clean == sev_det_clean)
    severity_score = 20.0 if severity_match else (10.0 if abs(
        {"minor": 1, "moderate": 2, "severe": 3}.get(sev_claim_clean, 1) -
        {"minor": 1, "moderate": 2, "severe": 3}.get(sev_det_clean, 1)
    ) == 1 else 0.0)

    # Base match bonus if user specifically mentioned the primary damaged part
    primary_part_matched = any(p in claimed_combined for p in detected_parts)
    if primary_part_matched and part_score < 25.0:
        part_score = 30.0

    total_score = round(min(100.0, max(15.0, part_score + type_score + severity_score)), 1)

    # Assign Verdict
    if total_score >= 75.0:
        verdict = "Match"
        summary = (
            f"AI assessment verified: Claimed damage on {claimed_part} strongly aligns "
            f"with detected damage patterns ({int(total_score)}% confidence match). Proceed to automated settlement."
        )
    elif total_score >= 45.0:
        verdict = "Partial Match"
        summary = (
            f"Partial consistency detected ({int(total_score)}% match). Detected damages partially overlap "
            f"with claimed description, but discrepancies exist in severity or secondary parts. Desk review recommended."
        )
    else:
        verdict = "Flagged"
        summary = (
            f"Significant discrepancy detected ({int(total_score)}% match). AI damage identification does not "
            f"align with user claimed description ({claimed_part}). Potential prior damage or exaggerated claim."
        )

    return {
        "match_score": total_score,
        "verdict": verdict,
        "summary": summary,
        "part_match": primary_part_matched,
        "severity_match": severity_match,
        "matched_damages": matched_items,
        "unclaimed_damages": unclaimed_items,
        "missing_claims": [] if primary_part_matched else [claimed_part]
    }
