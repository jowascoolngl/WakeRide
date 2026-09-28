from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import health, trips, vehicles

# Import models before creating tables.
from . import models  # noqa: F401


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description=(
        "WakeRide passenger alert and journey tracking API. "
        "MVP backend with simulated vehicle/GPS support."
    ),
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(health.router)
app.include_router(vehicles.router)
app.include_router(trips.router)


@app.get("/", tags=["root"])
def root():
    return {
        "name": "WakeRide API",
        "status": "running",
        "version": settings.VERSION,
        "docs": "/docs",
    }
