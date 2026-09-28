import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

function MapView({
  latitude,
  longitude,
  destinationLatitude,
  destinationLongitude,
}) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const busMarkerRef = useRef(null)
  const destinationMarkerRef = useRef(null)

  useEffect(() => {
    if (
      latitude == null ||
      longitude == null ||
      destinationLatitude == null ||
      destinationLongitude == null
    ) {
      return
    }

    const busPosition = [latitude, longitude]
    const destinationPosition = [
      destinationLatitude,
      destinationLongitude,
    ]

    // Create the map only once
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(
        busPosition,
        13
      )

      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; OpenStreetMap contributors',
        }
      ).addTo(mapRef.current)

      // 🚌 Bus marker
      busMarkerRef.current = L.marker(busPosition)
        .addTo(mapRef.current)
        .bindPopup('🚌 WakeRide Vehicle')

      // 📍 Destination marker
      destinationMarkerRef.current = L.marker(
        destinationPosition
      )
        .addTo(mapRef.current)
        .bindPopup('📍 Your Destination')
    } else {
      // Move existing bus marker
      busMarkerRef.current?.setLatLng(busPosition)

      // Move destination marker
      destinationMarkerRef.current?.setLatLng(
        destinationPosition
      )

      // Keep map centered around bus
      mapRef.current.setView(busPosition)
    }

    // Fit both markers inside the map
    const bounds = L.latLngBounds([
      busPosition,
      destinationPosition,
    ])

    mapRef.current.fitBounds(bounds, {
      padding: [40, 40],
    })

  }, [
    latitude,
    longitude,
    destinationLatitude,
    destinationLongitude,
  ])

  if (
    latitude == null ||
    longitude == null ||
    destinationLatitude == null ||
    destinationLongitude == null
  ) {
    return (
      <div className="map-container map-loading">
        Waiting for vehicle location...
      </div>
    )
  }

  return (
    <div
      ref={mapContainerRef}
      className="map-container"
    />
  )
}

export default MapView