# WakeRide Backend

FastAPI + SQLite MVP backend for the WakeRide passenger alert system.

## Run

From the `backend` directory:

```powershell
python -m pip install -r requirements.txt
python run.py
```

Open:

- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Health: http://localhost:8000/api/health

## Main flow

1. `POST /api/vehicles` creates a vehicle.
2. `POST /api/trips` starts a passenger trip.
3. `GET /api/trips/{trip_id}/status` calculates:
   - GPS distance
   - ETA
   - alert level
   - alert message
4. `PATCH /api/vehicles/{vehicle_id}/location` simulates/updates GPS.
5. `PATCH /api/trips/{trip_id}/sleep-mode` toggles Sleep Mode.
6. `DELETE /api/trips/{trip_id}` ends a trip.

## Alert thresholds

- > 5 km: NORMAL
- <= 5 km: PREPARE
- <= 2 km: WAKE_UP
- <= 0.5 km: CRITICAL
- <= 0.2 km: ARRIVED

This is an MVP/demo implementation. Replace simulated/manual GPS updates with an authorized fleet API or GNSS/IoT telemetry source for deployment.

## Security

Do not commit `.env`, API keys, credentials, or real fleet credentials.
