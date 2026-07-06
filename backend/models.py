from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Enum, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base

class RoleEnum(str, enum.Enum):
    PLATFORM_ADMIN = "PLATFORM_ADMIN"
    OWNER = "OWNER"
    MANAGER = "MANAGER"

class WorkspaceStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"

class PlanEnum(str, enum.Enum):
    FREE = "FREE"
    BASIC = "BASIC"
    PRO = "PRO"

class UnitStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    MAINTENANCE = "MAINTENANCE"

class TenantStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    MOVED_OUT = "MOVED_OUT"

class PaymentStatus(str, enum.Enum):
    COMPLETED = "COMPLETED"
    PENDING = "PENDING"
    FAILED = "FAILED"

class Workspace(Base):
    __tablename__ = "workspaces"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    status = Column(Enum(WorkspaceStatus), default=WorkspaceStatus.ACTIVE, nullable=False)
    plan = Column(Enum(PlanEnum), default=PlanEnum.FREE, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="workspace", cascade="all, delete-orphan")
    properties = relationship("Property", back_populates="workspace", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True)
    full_name = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.MANAGER)
    is_active = Column(Boolean, default=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True) # Null for PLATFORM_ADMIN
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Single-use token shared by both the "invite" flow (new user, is_active=False,
    # no usable password yet) and the "forgot password" flow (existing active user).
    reset_token = Column(String, nullable=True, index=True)
    reset_token_expires = Column(DateTime(timezone=True), nullable=True)

    workspace = relationship("Workspace", back_populates="users")

class Property(Base):
    __tablename__ = "properties"
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"))
    name = Column(String, index=True)
    address = Column(String)
    description = Column(Text, nullable=True)
    status = Column(String, default="Active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    workspace = relationship("Workspace", back_populates="properties")
    units = relationship("Unit", back_populates="property", cascade="all, delete-orphan")

class Unit(Base):
    __tablename__ = "units"
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"))
    unit_number = Column(String)
    monthly_rent = Column(Float)
    deposit_amount = Column(Float, default=0.0)
    status = Column(Enum(UnitStatus), default=UnitStatus.AVAILABLE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    property = relationship("Property", back_populates="units")
    tenants = relationship("Tenant", back_populates="unit", cascade="all, delete-orphan")

class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"))
    full_name = Column(String)
    phone_number = Column(String)
    email = Column(String, nullable=True)
    contract_start = Column(DateTime(timezone=True))
    contract_end = Column(DateTime(timezone=True))
    status = Column(Enum(TenantStatus), default=TenantStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    unit = relationship("Unit", back_populates="tenants")
    payments = relationship("Payment", back_populates="tenant", cascade="all, delete-orphan")

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    amount = Column(Float)
    payment_date = Column(DateTime(timezone=True), server_default=func.now())
    payment_method = Column(String)
    reference_number = Column(String, nullable=True)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.COMPLETED)

    tenant = relationship("Tenant", back_populates="payments")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    actor_email = Column(String, nullable=False)
    action = Column(String, nullable=False)
    detail = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class FeatureFlag(Base):
    __tablename__ = "feature_flags"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    label = Column(String, nullable=False)
    description = Column(String, nullable=True)
    enabled = Column(Boolean, default=False, nullable=False)

class Announcement(Base):
    __tablename__ = "announcements"
    id = Column(Integer, primary_key=True, index=True)
    message = Column(Text, nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
