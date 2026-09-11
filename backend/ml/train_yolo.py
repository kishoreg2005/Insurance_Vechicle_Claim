"""
YOLOv8-seg Vehicle Damage Segmentation Training Pipeline
Supports Ultralytics YOLOv8-seg on custom vehicle damage dataset (e.g. Roboflow / COCO format)

Usage:
    python backend/ml/train_yolo.py --data dataset.yaml --epochs 50 --imgsz 640 --batch 16
"""

import argparse
import sys
from pathlib import Path

def train_vehicle_damage_model(
    data_yaml: str,
    model_name: str = "yolov8n-seg.pt",
    epochs: int = 50,
    imgsz: int = 640,
    batch: int = 16,
    project_dir: str = "runs/segment"
):
    try:
        from ultralytics import YOLO
    except ImportError:
        print("[!] Ultralytics is not installed. Run: pip install ultralytics")
        sys.exit(1)

    print(f"[*] Initializing YOLOv8-seg model: {model_name}")
    model = YOLO(model_name)

    print(f"[*] Starting training on dataset: {data_yaml} for {epochs} epochs...")
    results = model.train(
        data=data_yaml,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        project=project_dir,
        name="vehicle_damage_seg",
        save=True,
        save_period=5,
        val=True,
        plots=True
    )
    print(f"[+] Training completed! Best model saved to: {results.save_dir}/weights/best.pt")
    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train YOLOv8-seg for vehicle damage assessment")
    parser.add_argument("--data", type=str, default="backend/ml/damage_dataset.yaml", help="Path to data.yaml")
    parser.add_argument("--model", type=str, default="yolov8n-seg.pt", help="Pretrained model base")
    parser.add_argument("--epochs", type=int, default=50, help="Number of training epochs")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    args = parser.parse_args()

    train_vehicle_damage_model(
        data_yaml=args.data,
        model_name=args.model,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch
    )
