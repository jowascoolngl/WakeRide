from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class VehicleCreate(BaseModel):
    vehicle_number: str = Field(min_length=1, max_length=50)
    route_name: str = Field(min_length=1, max_length=150)
    latitude: float
    longitude: float
    speed_kmph: float = Field(default=0, ge=0)


class VehicleLocationUpdate(BaseModel):
    latitude: float
    longitude: float
    speed_kmph: float = Field(default=0, ge=0)


class VehicleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_number: str
    route_name: str
    latitude: Optional[float]
    longitude: Optional[float]
    speed_kmph: float
    is_active: bool
    last_updated: datetime


class VehicleActiveUpdate(BaseModel):
    is_active: bool


class TripCreate(BaseModel):
    vehicle_id: int
    destination_name: str = Field(min_length=1, max_length=200)
    destination_latitude: float
    destination_longitude: float
    sleep_mode: bool = True


class TripResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    destination_name: str
    destination_latitude: float
    destination_longitude: float
    sleep_mode: bool
    active: bool
    created_at: datetime
    completed_at: Optional[datetime]


class SleepModeUpdate(BaseModel):
    enabled: bool


class TripStatus(BaseModel):
    trip_id: int
    vehicle_id: int
    vehicle_number: str
    route_name: str
    destination: str

    vehicle_latitude: Optional[float]
    vehicle_longitude: Optional[float]
    speed_kmph: float

    distance_km: Optional[float]
    eta_minutes: Optional[float]

    alert_level: str
    alert_message: str
    sleep_mode: bool
    active: bool
    last_updated: datetime
