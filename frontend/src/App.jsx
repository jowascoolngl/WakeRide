import { useEffect, useState } from 'react'
import './App.css'
import MapView from './MapView'
async function request(path, options) {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.detail || 'The request could not be completed.')
  }

  return data
}

function App() {
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [trip, setTrip] = useState(null)
  const [status, setStatus] = useState(null)
  const [destination, setDestination] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [routeName, setRouteName] = useState('')
  const [vehicleLatitude, setVehicleLatitude] = useState('')
  const [vehicleLongitude, setVehicleLongitude] = useState('')
  const [vehicleSpeed, setVehicleSpeed] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    request('/vehicles')
      .then((items) => {
        if (mounted) {
          setVehicles(items)
          setSelectedVehicle(items.find((vehicle) => vehicle.is_active)?.id?.toString() || '')
        }
      })
      .catch((loadError) => {
        if (mounted) setError(`Can't reach WakeRide right now. ${loadError.message}`)
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!trip) return undefined

    let mounted = true
    const refresh = () => {
      request(`/trips/${trip.id}/status`)
        .then((result) => {
          if (mounted) setStatus(result)
        })
        .catch((loadError) => {
          if (mounted) setError(loadError.message)
        })
    }

    refresh()
    const interval = window.setInterval(refresh, 10000)
    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [trip])

  async function addVehicle(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const vehicle = await request('/vehicles', {
        method: 'POST',
        body: JSON.stringify({
          vehicle_number: vehicleNumber,
          route_name: routeName,
          latitude: Number(vehicleLatitude),
          longitude: Number(vehicleLongitude),
          speed_kmph: Number(vehicleSpeed || 0),
        }),
      })
      setVehicles((current) => [...current, vehicle])
      setSelectedVehicle(vehicle.id.toString())
      setVehicleNumber('')
      setRouteName('')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setBusy(false)
    }
  }

  async function startTrip(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const created = await request('/trips', {
        method: 'POST',
        body: JSON.stringify({
          vehicle_id: Number(selectedVehicle),
          destination_name: destination,
          destination_latitude: Number(latitude),
          destination_longitude: Number(longitude),
          sleep_mode: true,
        }),
      })
      setTrip(created)
      setStatus(null)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setBusy(false)
    }
  }

  async function toggleSleepMode() {
    if (!status) return
    setError('')
    try {
      await request(`/trips/${status.trip_id}/sleep-mode`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: !status.sleep_mode }),
      })
      setStatus((current) => ({ ...current, sleep_mode: !current.sleep_mode }))
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  async function endTrip() {
    if (!status) return
    setBusy(true)
    setError('')
    try {
      await request(`/trips/${status.trip_id}`, { method: 'DELETE' })
      setTrip(null)
      setStatus(null)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setBusy(false)
    }
  }

  const activeVehicles = vehicles.filter((vehicle) => vehicle.is_active)

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="WakeRide home">
          <span className="brand-mark">W</span>
          <span>WakeRide</span>
        </a>
        <div className="connection"><span className="connection-dot" /> Passenger ride monitor</div>
      </header>

      <div className="page-content" id="home">
        <section className="intro">
          <p className="eyebrow">YOUR RIDE, RIGHT ON TIME</p>
          <h1>Know when to wake up.</h1>
          <p className="intro-copy">Track your vehicle and get a heads-up as your stop gets closer.</p>
        </section>

        {error && <div className="error-banner" role="alert">{error}</div>}

        {status?.active ? (
          <section className="tracker-panel" aria-live="polite">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">LIVE JOURNEY</p>
                <h2>{status.destination}</h2>
              </div>
              <span className={`alert-pill alert-${status.alert_level.toLowerCase()}`}>
                <span className="alert-dot" />{status.alert_level.replace('_', ' ')}
              </span>
            </div>
            <p className="alert-message">{status.alert_message}</p>
            <MapView
              latitude={status.vehicle_latitude}
              longitude={status.vehicle_longitude}  
              destinationLatitude={trip?.destination_latitude}
              destinationLongitude={trip?.destination_longitude}
            />
            <div className="journey-stats">
              <div className="journey-stat"><span>Estimated arrival</span><strong>{status.eta_minutes == null ? '--' : `${Math.ceil(status.eta_minutes)} min`}</strong></div>
              <div className="journey-stat"><span>Distance to stop</span><strong>{status.distance_km == null ? '--' : `${status.distance_km} km`}</strong></div>
              <div className="journey-stat"><span>Vehicle</span><strong>{status.vehicle_number}</strong></div>
            </div>
            <div className="route-strip">
              <div className="route-point"><span className="route-icon vehicle-icon">V</span><div><strong>{status.route_name}</strong><span>{status.speed_kmph} km/h · Live location</span></div></div>
              <div className="route-line"><span /></div>
              <div className="route-point"><span className="route-icon destination-icon">D</span><div><strong>{status.destination}</strong><span>Your stop</span></div></div>
            </div>
            <div className="trip-actions">
              <button className={`button ${status.sleep_mode ? 'button-sleep-on' : 'button-secondary'}`} type="button" onClick={toggleSleepMode}>
                <span aria-hidden="true">◷</span> Sleep Mode {status.sleep_mode ? 'On' : 'Off'}
              </button>
              <button className="button button-text" type="button" onClick={endTrip} disabled={busy}>End journey</button>
            </div>
            <p className="updated-at">Updated {new Date(status.last_updated).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · Refreshes every 10 seconds</p>
          </section>
        ) : trip ? (
          <section className="tracker-panel loading-panel" aria-live="polite">
            <span className="loading-indicator" />
            <div><h2>Finding your vehicle</h2><p>Connecting to the live journey now.</p></div>
          </section>
        ) : (
          <div className="setup-grid">
            <section className="form-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">PLAN A JOURNEY</p><h2>Where are you headed?</h2></div>
                <span className="step-number">01</span>
              </div>
              <form onSubmit={startTrip} className="form-stack">
                <label>Vehicle<select value={selectedVehicle} onChange={(event) => setSelectedVehicle(event.target.value)} required>
                  <option value="">Choose a vehicle</option>
                  {activeVehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.vehicle_number} · {vehicle.route_name}</option>)}
                </select></label>
                <label>Destination name<input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="e.g. Central Station" required /></label>
                <div className="field-row">
                  <label>Latitude<input type="number" step="any" value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="40.7128" required /></label>
                  <label>Longitude<input type="number" step="any" value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="-74.0060" required /></label>
                </div>
                <button className="button button-primary" type="submit" disabled={busy || !activeVehicles.length}>
                  {busy ? 'Starting journey...' : 'Start tracking'} <span aria-hidden="true">→</span>
                </button>
                {!activeVehicles.length && <p className="form-note">Add an active vehicle to start tracking.</p>}
              </form>
            </section>

            <section className="form-panel vehicle-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">FLEET SETUP</p><h2>Add a vehicle</h2></div>
                <span className="step-number">02</span>
              </div>
              <form onSubmit={addVehicle} className="form-stack">
                <div className="field-row">
                  <label>Vehicle number<input value={vehicleNumber} onChange={(event) => setVehicleNumber(event.target.value)} placeholder="WR-204" required /></label>
                  <label>Route name<input value={routeName} onChange={(event) => setRouteName(event.target.value)} placeholder="North line" required /></label>
                </div>
                <div className="field-row">
                  <label>Current latitude<input type="number" step="any" value={vehicleLatitude} onChange={(event) => setVehicleLatitude(event.target.value)} placeholder="40.7300" required /></label>
                  <label>Current longitude<input type="number" step="any" value={vehicleLongitude} onChange={(event) => setVehicleLongitude(event.target.value)} placeholder="-73.9950" required /></label>
                </div>
                <label>Speed <span className="unit-label">km/h</span><input type="number" min="0" step="any" value={vehicleSpeed} onChange={(event) => setVehicleSpeed(event.target.value)} placeholder="32" /></label>
                <button className="button button-secondary" type="submit" disabled={busy}>{busy ? 'Adding vehicle...' : 'Add to fleet'}</button>
              </form>
            </section>
          </div>
        )}

        <section className="fleet-summary">
          <div className="fleet-title"><span className="fleet-icon" aria-hidden="true">↗</span><div><h2>Your fleet</h2><p>{activeVehicles.length} active {activeVehicles.length === 1 ? 'vehicle' : 'vehicles'}</p></div></div>
          {activeVehicles.length ? <div className="vehicle-list">{activeVehicles.map((vehicle) => <div className="vehicle-row" key={vehicle.id}><span className="status-indicator" /><strong>{vehicle.vehicle_number}</strong><span>{vehicle.route_name}</span><span>{vehicle.speed_kmph} km/h</span></div>)}</div> : <p className="empty-fleet">Vehicles you add will appear here.</p>}
        </section>
      </div>
      <footer><span>WakeRide</span><span>Stay in the moment. We’ll watch your stop.</span></footer>
    </main>
  )
}

export default App
