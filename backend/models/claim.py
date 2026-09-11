from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.db.database import Base

class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    claim_number = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    vehicle_model = Column(String(100), default="Sedan")
    vehicle_plate = Column(String(50), default="Unknown")
    
    claimed_part = Column(String(200), nullable=False)
    claimed_description = Column(Text, nullable=False)
    claimed_severity = Column(String(50), default="Minor")
    
    status = Column(String(50), default="Pending", nullable=False)  # "Pending", "Approved", "Rejected", "Info Requested"
    verdict = Column(String(50), default="Match", nullable=False)  # "Match", "Partial Match", "Flagged"
    match_score = Column(Float, default=0.0)
    match_summary = Column(Text, nullable=True)
    
    estimated_cost_min = Column(Float, default=0.0)
    estimated_cost_max = Column(Float, default=0.0)
    
    admin_note = Column(Text, nullable=True)
    override_verdict = Column(String(50), nullable=True)
    override_by = Column(String(255), nullable=True)
    override_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="claims")
    images = relationship("ClaimImage", back_populates="claim", cascade="all, delete-orphan")
    detections = relationship("DetectionResult", back_populates="claim", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="claim", cascade="all, delete-orphan")

class ClaimImage(Base):
    __tablename__ = "claim_images"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id", ondelete="CASCADE"), nullable=False)
    image_path = Column(String(500), nullable=False)
    overlay_image_path = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=False)

    claim = relationship("Claim", back_populates="images")

class DetectionResult(Base):
    __tablename__ = "detection_results"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id", ondelete="CASCADE"), nullable=False)
    image_id = Column(Integer, nullable=True)
    
    part = Column(String(100), nullable=False)
    damage_type = Column(String(100), nullable=False)
    severity = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    cost_min = Column(Float, default=0.0)
    cost_max = Column(Float, default=0.0)
    
    bbox_json = Column(Text, nullable=True)
    mask_json = Column(Text, nullable=True)

    claim = relationship("Claim", back_populates="detections")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id", ondelete="CASCADE"), nullable=False)
    pdf_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    claim = relationship("Claim", back_populates="reports")
