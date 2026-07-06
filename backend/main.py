import logging
import os
from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from database import engine, Base, get_db, AsyncSessionLocal
from models import (User, Workspace, RoleEnum, Property, Unit, Tenant, Payment, PaymentStatus, UnitStatus,
                     TenantStatus, FeatureFlag, Announcement, WorkspaceStatus)
from schemas import (Token, UserResponse, PropertyCreate, PropertyResponse,
                     UnitCreate, UnitResponse, TenantCreate, TenantResponse, PaymentCreate, PaymentResponse,
                     PaginatedResponse, InviteUserRequest, InviteResponse, AcceptInviteRequest,
                     ForgotPasswordRequest, ResetPasswordRequest, SignupRequest, UserUpdate, UserStatusUpdate,
                     AnnouncementResponse)
from auth import verify_password, get_password_hash, create_access_token, generate_reset_token, ENVIRONMENT
from deps import get_current_user, require_roles, require_workspace_user, PaginationParams, paginate
from admin import log_action
import admin

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Pango API")

CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:8080").split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin.router)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    if ENVIRONMENT == "production":
        return

    # Seed demo/test accounts (development and staging only)
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).filter(User.email == "admin@platform.com"))
        admin_user = result.scalars().first()
        if not admin_user:
            logger.info("Seeding demo accounts...")
            hashed_pwd = get_password_hash("Password123!")

            # Platform Admin belongs to no workspace.
            platform_admin = User(
                email="admin@platform.com",
                hashed_password=hashed_pwd,
                full_name="Platform Admin",
                role=RoleEnum.PLATFORM_ADMIN,
                workspace_id=None,
            )
            db.add(platform_admin)

            workspace = Workspace(name="Tony Properties Ltd")
            db.add(workspace)
            await db.flush()

            owner = User(
                email="owner@tonyproperties.com",
                hashed_password=hashed_pwd,
                full_name="Tony Mwakalinga",
                role=RoleEnum.OWNER,
                workspace_id=workspace.id,
            )
            db.add(owner)

            manager = User(
                email="manager@tonyproperties.com",
                hashed_password=hashed_pwd,
                full_name="Property Manager",
                role=RoleEnum.MANAGER,
                workspace_id=workspace.id,
            )
            db.add(manager)

            db.add_all([
                FeatureFlag(key="maintenance_mode", label="Maintenance mode",
                            description="Shows a platform-wide maintenance banner to all workspace users.", enabled=False),
                FeatureFlag(key="beta_reports", label="Beta reports badge",
                            description="Marks the Reports section as Beta for all workspace users.", enabled=False),
            ])

            await db.commit()


@app.on_event("startup")
async def startup_event():
    await init_db()


@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == form_data.username))
    user = result.scalars().first()
    if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="This account has been deactivated")
    if user.workspace_id is not None:
        workspace = await db.get(Workspace, user.workspace_id)
        if not workspace or workspace.status != WorkspaceStatus.ACTIVE:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="This workspace has been suspended")
    access_token = create_access_token(
        data={"email": user.email, "role": user.role, "workspace_id": user.workspace_id}
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.get("/announcements/active", response_model=AnnouncementResponse | None)
async def get_active_announcement(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Announcement).filter(Announcement.is_active == True))
    return result.scalars().first()


# --- Self-service signup (public) ---

@app.post("/auth/signup", response_model=Token)
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)):
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    result = await db.execute(select(User).filter(User.email == payload.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="An account with that email already exists")

    workspace = Workspace(name=payload.workspace_name)
    db.add(workspace)
    await db.flush()

    owner = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role=RoleEnum.OWNER,
        workspace_id=workspace.id,
        is_active=True,
    )
    db.add(owner)
    await db.commit()
    await log_action(db, owner.email, "workspace.created", f"Self-service signup: '{workspace.name}'")

    access_token = create_access_token(data={"email": owner.email, "role": owner.role, "workspace_id": owner.workspace_id})
    return {"access_token": access_token, "token_type": "bearer"}


# --- Password reset / invite acceptance (public) ---

@app.post("/auth/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == payload.email, User.is_active == True))
    user = result.scalars().first()
    if user:
        token, expires = generate_reset_token()
        user.reset_token = token
        user.reset_token_expires = expires
        await db.commit()
        # No SMTP provider configured in this environment: log the link server-side
        # instead of emailing it. Wire a real email provider before production use.
        logger.info(f"Password reset link for {user.email}: /reset-password?token={token}")
    # Always return a generic response so we don't leak whether an email is registered.
    return {"detail": "If an account with that email exists, a reset link has been generated."}


@app.post("/auth/reset-password", response_model=Token)
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.reset_token == payload.token))
    user = result.scalars().first()
    if not user or not user.reset_token_expires or user.reset_token_expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired")

    user.hashed_password = get_password_hash(payload.password)
    user.reset_token = None
    user.reset_token_expires = None
    await db.commit()

    access_token = create_access_token(data={"email": user.email, "role": user.role, "workspace_id": user.workspace_id})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/auth/accept-invite", response_model=Token)
async def accept_invite(payload: AcceptInviteRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.reset_token == payload.token))
    user = result.scalars().first()
    if not user or not user.reset_token_expires or user.reset_token_expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="This invite link is invalid or has expired")

    user.hashed_password = get_password_hash(payload.password)
    user.is_active = True
    user.reset_token = None
    user.reset_token_expires = None
    await db.commit()

    access_token = create_access_token(data={"email": user.email, "role": user.role, "workspace_id": user.workspace_id})
    return {"access_token": access_token, "token_type": "bearer"}


# --- Properties / Units / Tenants / Payments (workspace-scoped) ---

@app.get("/properties", response_model=PaginatedResponse[PropertyResponse])
async def get_properties(
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_workspace_user)
):
    query = select(Property).filter(Property.workspace_id == current_user.workspace_id)
    return await paginate(db, query, params)

@app.post("/properties", response_model=PropertyResponse)
async def create_property(
    property_in: PropertyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_workspace_user)
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
    current_user: User = Depends(require_workspace_user)
):
    query = select(Unit).join(Property).filter(Property.workspace_id == current_user.workspace_id)
    return await paginate(db, query, params)

@app.post("/units", response_model=UnitResponse)
async def create_unit(
    unit_in: UnitCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_workspace_user)
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

@app.patch("/units/{unit_id}/status", response_model=UnitResponse)
async def update_unit_status(
    unit_id: int,
    status_in: UnitStatus,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_workspace_user)
):
    unit_result = await db.execute(select(Unit).join(Property).filter(Unit.id == unit_id, Property.workspace_id == current_user.workspace_id))
    unit = unit_result.scalars().first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found in workspace")
    unit.status = status_in
    await db.commit()
    await db.refresh(unit)
    return unit

@app.get("/tenants", response_model=PaginatedResponse[TenantResponse])
async def get_tenants(
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_workspace_user)
):
    query = select(Tenant).join(Unit).join(Property).filter(Property.workspace_id == current_user.workspace_id)
    return await paginate(db, query, params)

@app.get("/payments", response_model=PaginatedResponse[PaymentResponse])
async def get_payments(
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_workspace_user)
):
    query = select(Payment).join(Tenant).join(Unit).join(Property).filter(Property.workspace_id == current_user.workspace_id)
    return await paginate(db, query, params)

@app.post("/tenants", response_model=TenantResponse)
async def create_tenant(
    tenant_in: TenantCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_workspace_user)
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
    current_user: User = Depends(require_workspace_user)
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
    current_user: User = Depends(require_workspace_user)
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


# --- Workspace user management (Owner only — Managers cannot manage users) ---

@app.get("/users", response_model=PaginatedResponse[UserResponse])
async def get_users(
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.OWNER))
):
    query = select(User).filter(User.workspace_id == current_user.workspace_id)
    return await paginate(db, query, params)

@app.post("/users", response_model=InviteResponse)
async def invite_user(
    invite_in: InviteUserRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.OWNER))
):
    result = await db.execute(select(User).filter(User.email == invite_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Invited users are always Managers: only Platform Admin (via /admin) creates
    # Owners, and a workspace only ever has the one Owner it was created with.
    token, expires = generate_reset_token()
    new_user = User(
        email=invite_in.email,
        full_name=invite_in.full_name,
        role=RoleEnum.MANAGER,
        workspace_id=current_user.workspace_id,
        is_active=False,
        reset_token=token,
        reset_token_expires=expires,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return {"user": new_user, "invite_link": f"/accept-invite?token={token}"}

@app.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.OWNER))
):
    result = await db.execute(select(User).filter(User.id == user_id, User.workspace_id == current_user.workspace_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.full_name is not None:
        user.full_name = payload.full_name
    await db.commit()
    await db.refresh(user)
    return user

@app.patch("/users/{user_id}/status", response_model=UserResponse)
async def update_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.OWNER))
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")
    result = await db.execute(select(User).filter(User.id == user_id, User.workspace_id == current_user.workspace_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == RoleEnum.OWNER:
        raise HTTPException(status_code=400, detail="Cannot deactivate the workspace Owner")
    user.is_active = payload.is_active
    await db.commit()
    await db.refresh(user)
    return user

@app.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.OWNER))
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    result = await db.execute(select(User).filter(User.id == user_id, User.workspace_id == current_user.workspace_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == RoleEnum.OWNER:
        raise HTTPException(status_code=400, detail="Cannot delete the workspace Owner")
    await db.delete(user)
    await db.commit()
    return {"detail": "User deleted"}


# --- Reports / Dashboard (workspace-scoped) ---

@app.get("/reports/financial")
async def get_financial_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_workspace_user)
):
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
    current_user: User = Depends(require_workspace_user)
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
