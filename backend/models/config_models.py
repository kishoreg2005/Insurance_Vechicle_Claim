from sqlalchemy import Column, Integer, String, Float
from backend.db.database import Base

class CostConfig(Base):
    __tablename__ = "cost_configs"

    id = Column(Integer, primary_key=True, index=True)
    part = Column(String(100), nullable=False, index=True)
    damage_type = Column(String(100), nullable=False, index=True)
    severity = Column(String(50), nullable=False)  # "Minor", "Moderate", "Severe"
    cost_min = Column(Float, nullable=False)
    cost_max = Column(Float, nullable=False)

class SeverityConfig(Base):
    __tablename__ = "severity_configs"

    id = Column(Integer, primary_key=True, index=True)
    damage_type = Column(String(100), unique=True, nullable=False, index=True)
    weight = Column(Float, default=1.0, nullable=False)
    area_threshold_minor = Column(Float, default=0.05, nullable=False)     # percentage of bounding box/part area
    area_threshold_moderate = Column(Float, default=0.15, nullable=False)  # >= moderate, else severe if > threshold
