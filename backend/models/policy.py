from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.db.database import Base

class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    policy_number = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    vehicle_type = Column(String(50), default="Car", nullable=False)  # "Car", "Bike"
    vehicle_model = Column(String(100), nullable=False)
    vehicle_plate = Column(String(50), nullable=False)
    coverage_type = Column(String(50), default="Comprehensive", nullable=False)  # "Third-party", "Comprehensive"

    annual_premium = Column(Float, nullable=False)
    monthly_instalment = Column(Float, nullable=False)  # annual_premium / 12

    start_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    end_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="Active", nullable=False)  # "Active", "Expired", "Cancelled"

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="policies")


class PremiumRangeConfig(Base):
    __tablename__ = "premium_range_configs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_type = Column(String(50), nullable=False)      # "Car", "Bike"
    coverage_type = Column(String(50), nullable=False)     # "Third-party", "Comprehensive"
    min_annual_premium = Column(Float, nullable=False)
    max_annual_premium = Column(Float, nullable=False)
    default_annual_premium = Column(Float, nullable=False)
