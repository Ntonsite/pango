from pydantic import BaseModel, EmailStr
from typing import Optional, List, TypeVar, Generic
from datetime import datetime
from models import RoleEnum, UnitStatus, TenantStatus, PaymentStatus

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

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

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
