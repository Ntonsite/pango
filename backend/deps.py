from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from database import get_db
from models import User, RoleEnum, Workspace, WorkspaceStatus
from auth import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


class PaginationParams:
    def __init__(self, page: int = 1, size: int = 10):
        self.page = page
        self.size = size


async def paginate(db: AsyncSession, query, params: PaginationParams):
    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    items_result = await db.execute(query.offset((params.page - 1) * params.size).limit(params.size))
    items = items_result.scalars().all()
    pages = (total + params.size - 1) // params.size if total else 0
    return {
        "items": items,
        "total": total,
        "page": params.page,
        "size": params.size,
        "pages": pages
    }


async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
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
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def require_roles(*roles: RoleEnum):
    async def checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="You do not have permission to perform this action")
        return current_user
    return checker


async def require_workspace_user(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Owner/Manager endpoints: must belong to an active workspace (excludes Platform Admin)."""
    if current_user.role == RoleEnum.PLATFORM_ADMIN or current_user.workspace_id is None:
        raise HTTPException(status_code=403, detail="Platform Admin accounts do not belong to a workspace. Use the admin console instead.")
    workspace = await db.get(Workspace, current_user.workspace_id)
    if not workspace or workspace.status != WorkspaceStatus.ACTIVE:
        raise HTTPException(status_code=403, detail="This workspace has been suspended. Contact your Platform Admin.")
    return current_user
