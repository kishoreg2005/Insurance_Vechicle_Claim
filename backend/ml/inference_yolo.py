"""
YOLOv8-seg Inference Script for Vehicle Damage Segmentation
"""

import sys
from pathlib import Path
from typing import List, Dict, Any

def run_yolo_segmentation(image_path: str, weights_path: str = "yolov8n-seg.pt", conf_thresh: float = 0.25) -> List[Dict[str, Any]]:
    try:
        from ultralytics import YOLO
        import numpy as np
    except ImportError:
        print("[!] Ultralytics or numpy not installed. Using cv_engine fallback.")
        return []

    model = YOLO(weights_path)
    results = model.predict(source=image_path, conf=conf_thresh, save=False)

    detections = []
    for r in results:
        boxes = r.boxes
        masks = r.masks
        names = r.names

        if boxes is not None:
            for i, box in enumerate(boxes):
                cls_id = int(box.cls[0])
                cls_name = names.get(cls_id, f"class_{cls_id}")
                conf = float(box.conf[0])
                xyxy = [int(v) for v in box.xyxy[0].tolist()]

                polygon = []
                if masks is not None and len(masks) > i:
                    poly_arr = masks[i].xy[0]
                    polygon = [[int(pt[0]), int(pt[1])] for pt in poly_arr]

                detections.append({
                    "part": "Detected Component",
                    "damage_type": cls_name,
                    "severity": "Moderate" if conf > 0.6 else "Minor",
                    "confidence": round(conf, 3),
                    "bbox": xyxy,
                    "mask_polygon": polygon
                })

    return detections
