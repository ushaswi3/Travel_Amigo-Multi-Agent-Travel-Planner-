
"""
Repository layer: wraps database/crud.py with domain logic
(e.g. password verification, duplicate checks) so routes stay thin.
"""
from sqlalchemy.orm import Session

from database import crud, models
from utils.password_handler import hash_password, verify_password


def register_user(db: Session, username: str, email: str, password: str) -> models.User:
    if crud.get_user_by_username(db, username):
        raise ValueError("Username already taken")
    if crud.get_user_by_email(db, email):
        raise ValueError("Email already registered")

    hashed = hash_password(password)
    return crud.create_user(db, username=username, email=email, hashed_password=hashed)


def authenticate_user(db: Session, username: str, password: str) -> models.User | None:
    user = crud.get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
