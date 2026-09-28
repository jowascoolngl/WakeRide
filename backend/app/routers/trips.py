from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Trip, Vehicle
from ..schemas import (
    SleepModeUpdate,
    TripCreate,
    TripResponse,
    TripStatus,
)
from ..services.alerts import get_alert
from ..services.eta import calculate_eta_minutes
from ..services.geo import calculate_distance_km

router = APIRouter(prefix="/api/trips", tags=["trips"])


def utcnow():
    return datetime.now(timezone.utc)


@router.post("", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
def create_trip(payload: TripCreate, db: Session = Depends(get_db)):
    vehicle = db.get(Vehicle, payload.vehicle_id)

    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")

    if not vehicle.is_active:
        raise HTTPException(status_code=400, detail="Vehicle is not active.")

    trip = Trip(
        vehicle_id=payload.vehicle_id,
        destination_name=payload.destination_name,
        destination_latitude=payload.destination_latitude,
        destination_longitude=payload.destination_longitude,
        sleep_mode=payload.sleep_mode,
        active=True,
    )

    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


@router.get("", response_model=list[TripResponse])
def list_trips(
    active_only: bool = True,
    db: Session = Depends(get_db),
):
    query = db.query(Trip)

    if active_only:
        query = query.filter(Trip.active.is_(True))

    return query.order_by(Trip.id.desc()).all()


@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.get(Trip, trip_id)

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")

    return trip


@router.get("/{trip_id}/status", response_model=TripStatus)
def get_trip_status(trip_id: int, db: Session = Depends(get_db)):
    trip = db.get(Trip, trip_id)

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")

    vehicle = db.get(Vehicle, trip.vehicle_id)

    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")

    distance = None
    eta = None
    alert_level = "NORMAL"
    alert_message = "Journey in progress."

    if vehicle.latitude is not None and vehicle.longitude is not None:
        distance = calculate_distance_km(
            vehicle.latitude,
            vehicle.longitude,
            trip.destination_latitude,
            trip.destination_longitude,
        )
        distance = round(distance, 3)

        eta = calculate_eta_minutes(
            distance,
            vehicle.speed_kmph,
        )

        alert_level, alert_message = get_alert(distance)

    # Automatically mark a trip complete once the arrival threshold is reached.
    if distance is not None and distance <= 0.20 and trip.active:
        trip.active = False
        trip.completed_at = utcnow()
        db.commit()

    return TripStatus(
        trip_id=trip.id,
        vehicle_id=vehicle.id,
        vehicle_number=vehicle.vehicle_number,
        route_name=vehicle.route_name,
        destination=trip.destination_name,
        vehicle_latitude=vehicle.latitude,
        vehicle_longitude=vehicle.longitude,
        speed_kmph=vehicle.speed_kmph,
        distance_km=distance,
        eta_minutes=eta,
        alert_level=alert_level,
        alert_message=alert_message,
        sleep_mode=trip.sleep_mode,
        active=trip.active,
        last_updated=vehicle.last_updated,
    )


@router.patch("/{trip_id}/sleep-mode", response_model=TripResponse)
def update_sleep_mode(
    trip_id: int,
    payload: SleepModeUpdate,
    db: Session = Depends(get_db),
):
    trip = db.get(Trip, trip_id)

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")

    trip.sleep_mode = payload.enabled

    db.commit()
    db.refresh(trip)
    return trip


@router.delete("/{trip_id}")
def end_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.get(Trip, trip_id)

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")

    trip.active = False
    trip.completed_at = utcnow()

    db.commit()

    return {
        "message": "Trip ended.",
        "trip_id": trip.id,
    }
