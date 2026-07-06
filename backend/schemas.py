from pydantic import BaseModel, EmailStr
from typing import Optional, List, TypeVar, Generic
from datetime import datetime
from models import RoleEnum, UnitStatus, TenantStatus, PaymentStatus, WorkspaceStatus, PlanEnum

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    workspace_id: Optional[int] = None

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: RoleEnum
    workspace_id: Optional[int] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

class AdminUserResponse(UserResponse):
    workspace_name: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None

class UserStatusUpdate(BaseModel):
    is_active: bool

class InviteUserRequest(BaseModel):
    email: EmailStr
    full_name: str

class InviteResponse(BaseModel):
    user: UserResponse
    invite_link: str

class AcceptInviteRequest(BaseModel):
    token: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    password: str

class AdminResetPasswordResponse(BaseModel):
    reset_link: str

class PropertyBase(BaseModel):
    name: str
    address: str
    description: Optional[str] = None
    status: str = "Active"

class PropertyCreate(PropertyBase):
    pass

class PropertyResponse(PropertyBase):
    id: int
    workspace_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class UnitBase(BaseModel):
    unit_number: str
    monthly_rent: float
    deposit_amount: float = 0.0
    status: UnitStatus = UnitStatus.AVAILABLE

class UnitCreate(UnitBase):
    property_id: int

class UnitResponse(UnitBase):
    id: int
    property_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class TenantBase(BaseModel):
    full_name: str
    phone_number: str
    email: Optional[str] = None
    contract_start: datetime
    contract_end: datetime
    status: TenantStatus = TenantStatus.ACTIVE

class TenantCreate(TenantBase):
    unit_id: int

class TenantResponse(TenantBase):
    id: int
    unit_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class PaymentBase(BaseModel):
    amount: float
    payment_method: str
    reference_number: Optional[str] = None
    status: PaymentStatus = PaymentStatus.COMPLETED

class PaymentCreate(PaymentBase):
    tenant_id: int

class PaymentResponse(PaymentBase):
    id: int
    tenant_id: int
    payment_date: datetime
    class Config:
        from_attributes = True

class WorkspaceCreate(BaseModel):
    name: str
    owner_full_name: str
    owner_email: EmailStr

class WorkspaceResponse(BaseModel):
    id: int
    name: str
    status: WorkspaceStatus
    plan: PlanEnum
    created_at: datetime
    owner_email: Optional[str] = None
    owner_full_name: Optional[str] = None
    user_count: int = 0
    class Config:
        from_attributes = True

class WorkspaceCreateResponse(BaseModel):
    workspace: WorkspaceResponse
    invite_link: str

class WorkspaceStatusUpdate(BaseModel):
    status: WorkspaceStatus

class WorkspacePlanUpdate(BaseModel):
    plan: PlanEnum

class WorkspaceOverview(BaseModel):
    workspace: WorkspaceResponse
    totalProperties: int
    totalUnits: int
    occupiedUnits: int
    totalTenants: int
    monthlyCollectedIncome: float

class FeatureFlagResponse(BaseModel):
    id: int
    key: str
    label: str
    description: Optional[str] = None
    enabled: bool
    class Config:
        from_attributes = True

class FeatureFlagUpdate(BaseModel):
    enabled: bool

class AnnouncementCreate(BaseModel):
    message: str
    is_active: bool = True

class AnnouncementResponse(BaseModel):
    id: int
    message: str
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    actor_email: str
    action: str
    detail: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class PlatformAnalyticsResponse(BaseModel):
    total_workspaces: int
    active_workspaces: int
    suspended_workspaces: int
    total_users: int
    total_owners: int
    total_managers: int
    total_properties: int
    total_units: int
    total_tenants: int
    total_collected: float
    workspaces_by_month: List[dict]
