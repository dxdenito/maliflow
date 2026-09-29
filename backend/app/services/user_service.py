from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository
from app.schemas.user_schema import UserCreate, UserLogin


class UserService:
    def __init__(self, db: Session):
        self.repository = UserRepository(db)

    def register(self, user_data: UserCreate) -> User:
        existing_user = self.repository.get_by_email(
            user_data.email
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already registered",
            )

        user = User(
            name=user_data.name,
            email=user_data.email,
            password_hash=hash_password(user_data.password),
            role=UserRole.USER,
        )

        return self.repository.create(user)

    def login(self, user_data: UserLogin) -> tuple[User, str]:
        user = self.repository.get_by_email(
            user_data.email
        )

        if not user or not verify_password(
            user_data.password,
            user.password_hash,
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive",
            )

        access_token = create_access_token({
            "sub": str(user.id),
            "type": "access",
        })

        return user, access_token