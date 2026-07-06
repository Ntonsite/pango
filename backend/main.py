import logging
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List

from database import engine, Base, get_db, AsyncSessionLocal
from models import User, Workspace, RoleEnum, Property, Unit, Tenant, Payment, PaymentStatus, UnitStatus, TenantStatus
from schemas import (Token, UserResponse, UserCreate, PropertyCreate, PropertyResponse, 
                     UnitCreate, UnitResponse, TenantCreate, TenantResponse, PaymentCreate, PaymentResponse, PaginatedResponse)
from auth import verify_password, get_password_hash, create_access_token

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Pango API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed initial data
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).filter(User.email == "admin@pango.co.tz"))
        admin_user = result.scalars().first()
        if not admin_user:
            logger.info("Seeding initial admin and workspace...")
            workspace = Workspace(name="Tony Properties Ltd")
            db.add(workspace)
            await db.commit()
            await db.refresh(workspace)
            
            hashed_pwd = get_password_hash("Password123!")
            admin = User(
                email="admin@pango.co.tz",
                hashed_password=hashed_pwd,
                full_name="Platform Admin",
                role=RoleEnum.PLATFORM_ADMIN,
                workspace_id=workspace.id
            )
            db.add(admin)
            
            owner = User(
                email="owner@pango.co.tz",
                hashed_password=hashed_pwd,
                full_name="Workspace Owner",
                role=RoleEnum.OWNER,
                workspace_id=workspace.id
            )
            db.add(owner)
            
            manager = User(
                email="manager@pango.co.tz",
                hashed_password=hashed_pwd,
                full_name="Property Manager",
                role=RoleEnum.MANAGER,
                workspace_id=workspace.id
            )
            db.add(manager)
            await db.commit()

@app.on_event("startup")
async def startup_event():
    await init_db()

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    from jose import jwt, JWTError
    from auth import SECRET_KEY, ALGORITHM
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("email")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    result = await db.execute(select(User).filter(User.email == email))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == form_data.username))
    user = result.scalars().first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"email": user.email, "role": user.role, "workspace_id": user.workspace_id}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# Pagination Dependency
class PaginationParams:
    def __init__(self, page: int = 1, size: int = 10):
        self.page = page
        self.size = size

async def paginate(db: AsyncSession, query, params: PaginationParams):
    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    items_result = await db.execute(query.offset((params.page - 1) * params.size).limit(params.size))
    items = items_result.scalars().all()
    pages = (total + params.size - 1) // params.size
    return {
        "items": items,
        "total": total,
        "page": params.page,
        "size": params.size,
        "pages": pages
    }

@app.get("/properties", response_model=PaginatedResponse[PropertyResponse])
async def get_properties(
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Property).filter(Property.workspace_id == current_user.workspace_id)
    return await paginate(db, query, params)

@app.post("/properties", response_model=PropertyResponse)
async def create_property(
    property_in: PropertyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == RoleEnum.MANAGER:
        raise HTTPException(status_code=403, detail="Not authorized to create properties")
    new_prop = Property(**property_in.dict(), workspace_id=current_user.workspace_id)
    db.add(new_prop)
    await db.commit()
    await db.refresh(new_prop)
    return new_prop

@app.get("/units", response_model=PaginatedResponse[UnitResponse])
async def get_units(
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Unit).join(Property).filter(Property.workspace_id == current_user.workspace_id)
    return await paginate(db, query, params)

@app.get("/tenants", response_model=PaginatedResponse[TenantResponse])
async def get_tenants(
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Tenant).join(Unit).join(Property).filter(Property.workspace_id == current_user.workspace_id)
    return await paginate(db, query, params)

@app.get("/payments", response_model=PaginatedResponse[PaymentResponse])
async def get_payments(
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Payment).join(Tenant).join(Unit).join(Property).filter(Property.workspace_id == current_user.workspace_id)
    return await paginate(db, query, params)

@app.post("/units", response_model=UnitResponse)
async def create_unit(
    unit_in: UnitCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prop_result = await db.execute(select(Property).filter(Property.id == unit_in.property_id, Property.workspace_id == current_user.workspace_id))
    prop = prop_result.scalars().first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found in workspace")
    new_unit = Unit(**unit_in.dict())
    db.add(new_unit)
    await db.commit()
    await db.refresh(new_unit)
    return new_unit

@app.post("/tenants", response_model=TenantResponse)
async def create_tenant(
    tenant_in: TenantCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    unit_result = await db.execute(select(Unit).join(Property).filter(Unit.id == tenant_in.unit_id, Property.workspace_id == current_user.workspace_id))
    unit = unit_result.scalars().first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found in workspace")
    
    unit.status = UnitStatus.OCCUPIED
    
    new_tenant = Tenant(**tenant_in.dict())
    db.add(new_tenant)
    await db.commit()
    await db.refresh(new_tenant)
    return new_tenant

@app.put("/tenants/{tenant_id}/status", response_model=TenantResponse)
async def update_tenant_status(
    tenant_id: int,
    status_in: TenantStatus,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tenant_result = await db.execute(select(Tenant).join(Unit).join(Property).filter(Tenant.id == tenant_id, Property.workspace_id == current_user.workspace_id))
    tenant = tenant_result.scalars().first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found in workspace")
    
    tenant.status = status_in
    if status_in == TenantStatus.MOVED_OUT:
        unit_result = await db.execute(select(Unit).filter(Unit.id == tenant.unit_id))
        unit = unit_result.scalars().first()
        if unit:
            unit.status = UnitStatus.AVAILABLE
            
    await db.commit()
    await db.refresh(tenant)
    return tenant

@app.post("/payments", response_model=PaymentResponse)
async def create_payment(
    payment_in: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tenant_result = await db.execute(select(Tenant).join(Unit).join(Property).filter(Tenant.id == payment_in.tenant_id, Property.workspace_id == current_user.workspace_id))
    tenant = tenant_result.scalars().first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found in workspace")
    new_payment = Payment(**payment_in.dict())
    db.add(new_payment)
    await db.commit()
    await db.refresh(new_payment)
    return new_payment

@app.get("/users", response_model=PaginatedResponse[UserResponse])
async def get_users(
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only Admin or Owner can view users
    if current_user.role not in [RoleEnum.PLATFORM_ADMIN, RoleEnum.OWNER]:
        raise HTTPException(status_code=403, detail="Not authorized to view users")
    
    query = select(User).filter(User.workspace_id == current_user.workspace_id)
    return await paginate(db, query, params)

@app.post("/users", response_model=UserResponse)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [RoleEnum.PLATFORM_ADMIN, RoleEnum.OWNER]:
        raise HTTPException(status_code=403, detail="Not authorized to create users")
    
    result = await db.execute(select(User).filter(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_pwd = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
        role=user_in.role,
        workspace_id=current_user.workspace_id
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@app.get("/reports/financial")
async def get_financial_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Managers, Owners, and Admins can view reports
    workspace_id = current_user.workspace_id
    total_collections = await db.scalar(
        select(func.sum(Payment.amount)).join(Tenant).join(Unit).join(Property)
        .filter(Property.workspace_id == workspace_id, Payment.status == PaymentStatus.COMPLETED)
    )
    return {
        "status": "success",
        "total_collections": total_collections or 0,
        "message": "Report generated successfully"
    }

@app.get("/dashboard/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workspace_id = current_user.workspace_id
    
    total_props = await db.scalar(select(func.count(Property.id)).filter(Property.workspace_id == workspace_id))
    total_units = await db.scalar(select(func.count(Unit.id)).join(Property).filter(Property.workspace_id == workspace_id))
    
    occupied_units = await db.scalar(
        select(func.count(Unit.id)).join(Property)
        .filter(Property.workspace_id == workspace_id, Unit.status == "OCCUPIED")
    )
    
    collected_income = await db.scalar(
        select(func.sum(Payment.amount)).join(Tenant).join(Unit).join(Property)
        .filter(Property.workspace_id == workspace_id, Payment.status == "COMPLETED")
    )
    
    expected_income = await db.scalar(
        select(func.sum(Unit.monthly_rent)).join(Property)
        .filter(Property.workspace_id == workspace_id, Unit.status == "OCCUPIED")
    )
    
    return {
        "totalProperties": total_props or 0,
        "totalUnits": total_units or 0,
        "occupiedUnits": occupied_units or 0,
        "vacantUnits": (total_units or 0) - (occupied_units or 0),
        "monthlyExpectedIncome": expected_income or 0,
        "monthlyCollectedIncome": collected_income or 0,
        "collectionRate": (collected_income / expected_income * 100) if expected_income else 0,
        "contractsExpiringSoon": 0,
        "outstandingRent": (expected_income or 0) - (collected_income or 0),
    }
