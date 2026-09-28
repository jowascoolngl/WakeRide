from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Vehicle
from ..schemas import (
    VehicleActiveUpdate,
    VehicleCreate,
    VehicleLocationUpdate,
    VehicleResponse,
)

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


def utcnow():
    return datetime.now(timezone.utc)


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(Vehicle)
        .filter(Vehicle.vehicle_number == payload.vehicle_number)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="A vehicle with this vehicle_number already exists.",
        )

    vehicle = Vehicle(
        vehicle_number=payload.vehicle_number,
        route_name=payload.route_name,
        latitude=payload.latitude,
        longitude=payload.longitude,
        speed_kmph=payload.speed_kmph,
        is_active=True,
        last_updated=utcnow(),
    )

    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.get("", response_model=list[VehicleResponse])
def list_vehicles(
    active_only: bool = False,
    db: Session = Depends(get_db),
):
    query = db.query(Vehicle)

    if active_only:
        query = query.filter(Vehicle.is_active.is_(True))

    return query.order_by(Vehicle.id).all()


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.get(Vehicle, vehicle_id)

    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")

    return vehicle


@router.patch("/{vehicle_id}/location", response_model=VehicleResponse)
def update_vehicle_location(
    vehicle_id: int,
    payload: VehicleLocationUpdate,
    db: Session = Depends(get_db),
):
    vehicle = db.get(Vehicle, vehicle_id)

    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")

    vehicle.latitude = payload.latitude
    vehicle.longitude = payload.longitude
    vehicle.speed_kmph = payload.speed_kmph
    vehicle.last_updated = utcnow()

    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.patch("/{vehicle_id}/active", response_model=VehicleResponse)
def update_vehicle_active(
    vehicle_id: int,
    payload: VehicleActiveUpdate,
    db: Session = Depends(get_db),
):
    vehicle = db.get(Vehicle, vehicle_id)

    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")

    vehicle.is_active = payload.is_active
    vehicle.last_updated = utcnow()

    db.commit()
    db.refresh(vehicle)
    return vehicle
