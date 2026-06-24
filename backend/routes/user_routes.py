from fastapi import APIRouter, Depends

from database.models import User
from middleware.auth_middleware import get_current_user
from schemas.user_schema import UserOut

router = APIRouter(prefix="/user", tags=["User"])


@router.get("/me", response_model=UserOut)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user

