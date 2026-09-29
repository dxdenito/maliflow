from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

import jwt



from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.repositories.user_repository import UserRepository


def get_current_user(
    maliflow_access: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
    )

    if not maliflow_access:
        raise credentials_exception

    try:
        payload = decode_access_token(maliflow_access)
        user_id = payload.get("sub")

        if not user_id:
            raise credentials_exception

        user_id = int(user_id)

    except (ValueError, TypeError, jwt.PyJWTError):
        raise credentials_exception

    repository = UserRepository(db)
    user = repository.get_by_id(user_id)

    if not user or not user.is_active:
        raise credentials_exception

    return user