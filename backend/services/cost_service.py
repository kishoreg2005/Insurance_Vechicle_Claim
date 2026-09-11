from typing import List, Dict, Any, Tuple
from backend.db.firebase_db import firebase_db

# Fallback cost benchmarks if no specific DB rule exists
FALLBACK_COST_TABLE = {
    "minor": (3000.0, 12000.0),
    "moderate": (12000.0, 35000.0),
    "severe": (35000.0, 95000.0)
}

def calculate_item_cost(part: str, damage_type: str, severity: str, db=None) -> Tuple[float, float]:
    """
    Looks up matching rule in Firebase cost_configs collection.
    Matches (part, damage_type, severity).
    Falls back to (part, severity) or (damage_type, severity) or generic severity tier.
    """
    p_clean = part.strip().lower()
    dt_clean = damage_type.strip().lower()
    sev_clean = severity.strip().capitalize()

    cost_rules = firebase_db.get_collection("cost_configs")

    # 1. Exact match
    for rule in cost_rules:
        if (rule.get("part", "").strip().lower() == p_clean and
            rule.get("damage_type", "").strip().lower() == dt_clean and
            rule.get("severity", "").strip().capitalize() == sev_clean):
            return float(rule.get("cost_min", 0)), float(rule.get("cost_max", 0))

    # 2. Match by part and severity
    for rule in cost_rules:
        if (rule.get("part", "").strip().lower() == p_clean and
            rule.get("severity", "").strip().capitalize() == sev_clean):
            return float(rule.get("cost_min", 0)), float(rule.get("cost_max", 0))

    # 3. Match by damage type and severity
    for rule in cost_rules:
        if (rule.get("damage_type", "").strip().lower() == dt_clean and
            rule.get("severity", "").strip().capitalize() == sev_clean):
            return float(rule.get("cost_min", 0)), float(rule.get("cost_max", 0))

    # 4. Fallback default based on severity tier
    return FALLBACK_COST_TABLE.get(sev_clean.lower(), (5000.0, 20000.0))

def estimate_total_claim_cost(detections: List[Dict[str, Any]], db=None) -> Tuple[float, float, List[Dict[str, Any]]]:
    """
    Calculates total cost range by aggregating item costs and updates each detection with its cost range.
    """
    total_min = 0.0
    total_max = 0.0
    enriched = []

    for d in detections:
        c_min, c_max = calculate_item_cost(
            part=d.get("part", "Panel"),
            damage_type=d.get("damage_type", "Dent"),
            severity=d.get("severity", "Minor"),
            db=db
        )
        total_min += c_min
        total_max += c_max
        d_copy = dict(d)
        d_copy["cost_min"] = c_min
        d_copy["cost_max"] = c_max
        enriched.append(d_copy)

    # If no detections, baseline inspection estimate
    if not detections:
        total_min, total_max = 2500.0, 5000.0

    return round(total_min, 2), round(total_max, 2), enriched
