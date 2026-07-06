from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from datetime import datetime, timedelta, timezone

from database import get_db
from deps import require_roles, PaginationParams, paginate
from models import (User, Workspace, RoleEnum, WorkspaceStatus, Property, Unit, Tenant, Payment,
                     AuditLog, FeatureFlag, Announcement)
from schemas import (WorkspaceCreate, WorkspaceResponse, WorkspaceCreateResponse, WorkspaceStatusUpdate,
                      WorkspacePlanUpdate, WorkspaceOverview, AdminUserResponse, UserStatusUpdate,
                      AdminResetPasswordResponse, PaginatedResponse, FeatureFlagResponse, FeatureFlagUpdate,
                      AnnouncementCreate, AnnouncementResponse, AuditLogResponse, PlatformAnalyticsResponse)
from auth import generate_reset_token

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_roles(RoleEnum.PLATFORM_ADMIN))])


async def log_action(db: AsyncSession, actor_email: str, action: str, detail: str = None):
    db.add(AuditLog(actor_email=actor_email, action=action, detail=detail))
    await db.commit()


# --- Workspaces ---

async def _to_workspace_response(db: AsyncSession, workspace: Workspace) -> dict:
    owner_result = await db.execute(select(User).filter(User.workspace_id == workspace.id, User.role == RoleEnum.OWNER))
    owner = owner_result.scalars().first()
    user_count = await db.scalar(select(func.count(User.id)).filter(User.workspace_id == workspace.id))
    return {
        "id": workspace.id,
        "name": workspace.name,
        "status": workspace.status,
        "plan": workspace.plan,
        "created_at": workspace.created_at,
        "owner_email": owner.email if owner else None,
        "owner_full_name": owner.full_name if owner else None,
        "user_count": user_count or 0,
    }


@router.get("/workspaces", response_model=PaginatedResponse[WorkspaceResponse])
async def list_workspaces(params: PaginationParams = Depends(), db: AsyncSession = Depends(get_db)):
    query = select(Workspace).order_by(Workspace.created_at.desc())
    result = await paginate(db, query, params)
    result["items"] = [await _to_workspace_response(db, ws) for ws in result["items"]]
    return result


@router.post("/workspaces", response_model=WorkspaceCreateResponse)
async def create_workspace(payload: WorkspaceCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_roles(RoleEnum.PLATFORM_ADMIN))):
    existing = await db.execute(select(User).filter(User.email == payload.owner_email))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="A user with that email already exists")

    workspace = Workspace(name=payload.name)
    db.add(workspace)
    await db.flush()

    token, expires = generate_reset_token()
    owner = User(
        email=payload.owner_email,
        full_name=payload.owner_full_name,
        role=RoleEnum.OWNER,
        workspace_id=workspace.id,
        is_active=False,
        reset_token=token,
        reset_token_expires=expires,
    )
    db.add(owner)
    await db.commit()
    await db.refresh(workspace)

    await log_action(db, current_user.email, "workspace.created", f"Created workspace '{workspace.name}' with owner {payload.owner_email}")

    return {
        "workspace": await _to_workspace_response(db, workspace),
        "invite_link": f"/accept-invite?token={token}",
    }


@router.patch("/workspaces/{workspace_id}/status", response_model=WorkspaceResponse)
async def update_workspace_status(workspace_id: int, payload: WorkspaceStatusUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_roles(RoleEnum.PLATFORM_ADMIN))):
    workspace = await db.get(Workspace, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    workspace.status = payload.status
    await db.commit()
    await db.refresh(workspace)
    await log_action(db, current_user.email, "workspace.status_changed", f"Workspace '{workspace.name}' set to {payload.status}")
    return await _to_workspace_response(db, workspace)


@router.patch("/workspaces/{workspace_id}/plan", response_model=WorkspaceResponse)
async def update_workspace_plan(workspace_id: int, payload: WorkspacePlanUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_roles(RoleEnum.PLATFORM_ADMIN))):
    workspace = await db.get(Workspace, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    workspace.plan = payload.plan
    await db.commit()
    await db.refresh(workspace)
    await log_action(db, current_user.email, "workspace.plan_changed", f"Workspace '{workspace.name}' moved to {payload.plan} plan")
    return await _to_workspace_response(db, workspace)


@router.delete("/workspaces/{workspace_id}")
async def delete_workspace(workspace_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_roles(RoleEnum.PLATFORM_ADMIN))):
    workspace = await db.get(Workspace, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    name = workspace.name
    await db.delete(workspace)
    await db.commit()
    await log_action(db, current_user.email, "workspace.deleted", f"Deleted workspace '{name}' (id={workspace_id})")
    return {"detail": "Workspace deleted"}


@router.get("/workspaces/{workspace_id}/overview", response_model=WorkspaceOverview)
async def workspace_overview(workspace_id: int, db: AsyncSession = Depends(get_db)):
    workspace = await db.get(Workspace, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    total_props = await db.scalar(select(func.count(Property.id)).filter(Property.workspace_id == workspace_id))
    total_units = await db.scalar(select(func.count(Unit.id)).join(Property).filter(Property.workspace_id == workspace_id))
    occupied_units = await db.scalar(select(func.count(Unit.id)).join(Property).filter(Property.workspace_id == workspace_id, Unit.status == "OCCUPIED"))
    total_tenants = await db.scalar(select(func.count(Tenant.id)).join(Unit).join(Property).filter(Property.workspace_id == workspace_id))
    collected = await db.scalar(
        select(func.sum(Payment.amount)).join(Tenant).join(Unit).join(Property)
        .filter(Property.workspace_id == workspace_id, Payment.status == "COMPLETED")
    )

    return {
        "workspace": await _to_workspace_response(db, workspace),
        "totalProperties": total_props or 0,
        "totalUnits": total_units or 0,
        "occupiedUnits": occupied_units or 0,
        "totalTenants": total_tenants or 0,
        "monthlyCollectedIncome": collected or 0,
    }


# --- Cross-workspace users ---

@router.get("/users", response_model=PaginatedResponse[AdminUserResponse])
async def list_all_users(params: PaginationParams = Depends(), db: AsyncSession = Depends(get_db)):
    query = select(User).order_by(User.created_at.desc())
    result = await paginate(db, query, params)
    items = []
    for u in result["items"]:
        workspace_name = None
        if u.workspace_id:
            ws = await db.get(Workspace, u.workspace_id)
            workspace_name = ws.name if ws else None
        items.append({**u.__dict__, "workspace_name": workspace_name})
    result["items"] = items
    return result


@router.post("/users/{user_id}/reset-password", response_model=AdminResetPasswordResponse)
async def admin_reset_password(user_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_roles(RoleEnum.PLATFORM_ADMIN))):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    token, expires = generate_reset_token()
    user.reset_token = token
    user.reset_token_expires = expires
    await db.commit()
    await log_action(db, current_user.email, "user.password_reset_issued", f"Issued password reset for {user.email}")
    return {"reset_link": f"/reset-password?token={token}"}


@router.patch("/users/{user_id}/status", response_model=UserStatusUpdate)
async def admin_update_user_status(user_id: int, payload: UserStatusUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_roles(RoleEnum.PLATFORM_ADMIN))):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == RoleEnum.PLATFORM_ADMIN:
        raise HTTPException(status_code=400, detail="Cannot deactivate a Platform Admin account")
    user.is_active = payload.is_active
    await db.commit()
    await log_action(db, current_user.email, "user.status_changed", f"Set {user.email} active={payload.is_active}")
    return {"is_active": user.is_active}


# --- Analytics ---

@router.get("/analytics", response_model=PlatformAnalyticsResponse)
async def platform_analytics(db: AsyncSession = Depends(get_db)):
    total_workspaces = await db.scalar(select(func.count(Workspace.id))) or 0
    active_workspaces = await db.scalar(select(func.count(Workspace.id)).filter(Workspace.status == WorkspaceStatus.ACTIVE)) or 0
    suspended_workspaces = await db.scalar(select(func.count(Workspace.id)).filter(Workspace.status == WorkspaceStatus.SUSPENDED)) or 0
    total_users = await db.scalar(select(func.count(User.id))) or 0
    total_owners = await db.scalar(select(func.count(User.id)).filter(User.role == RoleEnum.OWNER)) or 0
    total_managers = await db.scalar(select(func.count(User.id)).filter(User.role == RoleEnum.MANAGER)) or 0
    total_properties = await db.scalar(select(func.count(Property.id))) or 0
    total_units = await db.scalar(select(func.count(Unit.id))) or 0
    total_tenants = await db.scalar(select(func.count(Tenant.id))) or 0
    total_collected = await db.scalar(select(func.sum(Payment.amount)).filter(Payment.status == "COMPLETED")) or 0

    since = datetime.now(timezone.utc) - timedelta(days=180)
    monthly_result = await db.execute(
        select(Workspace.created_at).filter(Workspace.created_at >= since)
    )
    counts = {}
    for (created_at,) in monthly_result.all():
        key = created_at.strftime('%Y-%m')
        counts[key] = counts.get(key, 0) + 1
    workspaces_by_month = [{"month": k, "count": v} for k, v in sorted(counts.items())]

    return {
        "total_workspaces": total_workspaces,
        "active_workspaces": active_workspaces,
        "suspended_workspaces": suspended_workspaces,
        "total_users": total_users,
        "total_owners": total_owners,
        "total_managers": total_managers,
        "total_properties": total_properties,
        "total_units": total_units,
        "total_tenants": total_tenants,
        "total_collected": total_collected,
        "workspaces_by_month": workspaces_by_month,
    }


# --- Feature flags ---

@router.get("/feature-flags", response_model=list[FeatureFlagResponse])
async def list_feature_flags(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FeatureFlag).order_by(FeatureFlag.id))
    return result.scalars().all()


@router.patch("/feature-flags/{key}", response_model=FeatureFlagResponse)
async def update_feature_flag(key: str, payload: FeatureFlagUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_roles(RoleEnum.PLATFORM_ADMIN))):
    result = await db.execute(select(FeatureFlag).filter(FeatureFlag.key == key))
    flag = result.scalars().first()
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    flag.enabled = payload.enabled
    await db.commit()
    await db.refresh(flag)
    await log_action(db, current_user.email, "feature_flag.toggled", f"{key} set to {payload.enabled}")
    return flag


# --- Announcements ---

@router.get("/announcements", response_model=list[AnnouncementResponse])
async def list_announcements(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Announcement).order_by(Announcement.created_at.desc()))
    return result.scalars().all()


@router.post("/announcements", response_model=AnnouncementResponse)
async def create_announcement(payload: AnnouncementCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_roles(RoleEnum.PLATFORM_ADMIN))):
    if payload.is_active:
        await db.execute(Announcement.__table__.update().values(is_active=False))
    announcement = Announcement(message=payload.message, is_active=payload.is_active)
    db.add(announcement)
    await db.commit()
    await db.refresh(announcement)
    await log_action(db, current_user.email, "announcement.created", payload.message[:120])
    return announcement


@router.patch("/announcements/{announcement_id}/status", response_model=AnnouncementResponse)
async def update_announcement_status(announcement_id: int, payload: FeatureFlagUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_roles(RoleEnum.PLATFORM_ADMIN))):
    announcement = await db.get(Announcement, announcement_id)
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    if payload.enabled:
        await db.execute(Announcement.__table__.update().values(is_active=False))
    announcement.is_active = payload.enabled
    await db.commit()
    await db.refresh(announcement)
    await log_action(db, current_user.email, "announcement.status_changed", f"id={announcement_id} active={payload.enabled}")
    return announcement


# --- Audit logs ---

@router.get("/logs", response_model=PaginatedResponse[AuditLogResponse])
async def list_logs(params: PaginationParams = Depends(), db: AsyncSession = Depends(get_db)):
    query = select(AuditLog).order_by(AuditLog.created_at.desc())
    return await paginate(db, query, params)
