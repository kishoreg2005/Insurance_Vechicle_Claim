from typing import List, Dict, Any
from backend.db.firebase_db import firebase_db

def get_severity_configs_map(db=None) -> Dict[str, dict]:
    configs = firebase_db.get_collection("severity_configs")
    if not configs:
        return {}
    return {c.get("damage_type", "").lower(): c for c in configs}

def score_item_severity(damage_type: str, bbox: List[int], img_w: int, img_h: int, db=None) -> str:
    """
    Computes severity level ('Minor', 'Moderate', 'Severe') based on area ratio and weights.
    """
    cfg_map = get_severity_configs_map(db)
    cfg = cfg_map.get(damage_type.lower(), {})
    
    # Calculate bounding box area ratio
    x1, y1, x2, y2 = bbox
    box_area = max(1, (x2 - x1) * (y2 - y1))
    total_area = max(1, img_w * img_h)
    area_ratio = box_area / total_area

    minor_thresh = float(cfg.get("area_threshold_minor", 0.05))
    mod_thresh = float(cfg.get("area_threshold_moderate", 0.15))
    weight = float(cfg.get("weight", 1.0))

    adjusted_ratio = area_ratio * weight

    if adjusted_ratio < minor_thresh:
        return "Minor"
    elif adjusted_ratio < mod_thresh:
        return "Moderate"
    else:
        return "Severe"

def compute_overall_severity(detections: List[Dict[str, Any]]) -> str:
    if not detections:
        return "Minor"
    severe_count = sum(1 for d in detections if d.get("severity") == "Severe")
    mod_count = sum(1 for d in detections if d.get("severity") == "Moderate")
    
    if severe_count >= 2 or (severe_count >= 1 and mod_count >= 1):
        return "Severe"
    elif severe_count >= 1 or mod_count >= 1:
        return "Moderate"
    return "Minor"
