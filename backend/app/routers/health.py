from fastapi import APIRouter

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("")
def health_check():
    return {
        "status": "ok",
        "service": "WakeRide API",
    }
