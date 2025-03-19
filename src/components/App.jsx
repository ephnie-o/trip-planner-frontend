'use client'

import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react'
import axios from 'axios'
import dynamic from 'next/dynamic'
import LocationSearch from './LocationSearch';

const MapComponent = dynamic(() => import('../components/MapComponent'), { ssr: false })

export default function Home() {
  const [currentLocationCoords, setCurrentLocationCoords] = useState(null)
  const [currentLocationAddress, setCurrentLocationAddress] = useState('')
  const [isFallbackMode, setIsFallbackMode] = useState(false)

  // States for pickup and dropoff (object with displayName, lat, lon)
  const [pickupLocation, setPickupLocation] = useState(null)
  const [dropoffLocation, setDropoffLocation] = useState(null)
  const [currentCycleHours, setCurrentCycleHours] = useState("")
  const [routeData, setRouteData] = useState(null)
  const [stops, setStops] = useState([])
  const [tripData, setTripData] = useState(null)

  useEffect(() => {
    const geoSuccess = async (position) => {
      const { latitude, longitude } = position.coords
      setCurrentLocationCoords({ lat: latitude, lon: longitude })

      try {
        const res = await axios.get('https://nominatim.openstreetmap.org/reverse', {
          params: { lat: latitude, lon: longitude, format: 'json' }
        })
        setCurrentLocationAddress(res.data.display_name || "Unknown Location")
      } catch (err) {
        console.error('Error fetching address:', err)
        setIsFallbackMode(true)  // Enable manual entry if address fails
      }
    }


    const geoError = (error) => {
      console.warn('Geolocation error. Manual entry required.', error)
      setIsFallbackMode(true) // Triggers manual entry fallback
    }


    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        geoSuccess,
        geoError,
        { timeout: 20000 } // 10 seconds timeout
      )
    } else {
      setIsFallbackMode(true)  // Enable manual entry if unsupported
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!currentLocationCoords || !pickupLocation || !dropoffLocation) {
        alert('Please ensure current, pickup, and dropoff locations are set.')
        return
    }

    try {
        const payload = {
            current_location: `${currentLocationCoords.lat},${currentLocationCoords.lon}`,
            current_location_address: currentLocationAddress,
            pickup_location: `${pickupLocation.lat},${pickupLocation.lon}`,
            pickup_address: pickupLocation.displayName,
            dropoff_location: `${dropoffLocation.lat},${dropoffLocation.lon}`,
            dropoff_address: dropoffLocation.displayName,
            current_cycle_used: currentCycleHours
        }
      // Adjust the URL based on your Django backend deployment
      const response = await axios.post("https://trip-planner-api-rc1h.onrender.com/api/create_trip/", payload)
      setRouteData(response.data.route_geometry)
      setStops(response.data.stops)
      setTripData(response.data)
    } catch (error) {
      console.error("Error fetching route:", error)
    }
  }

  // Determine an initial center for the map
  const initialCenter =
    routeData && routeData.coordinates && routeData.coordinates.length > 0
      ? [routeData.coordinates[0][1], routeData.coordinates[0][0]]
      : currentLocationCoords ? [currentLocationCoords.lat, currentLocationCoords.lon] : [0, 0]


      const downloadLogSheet = async () => {
        if (!tripData) return
        try {
          const response = await axios.get(
            `https://trip-planner-api-rc1h.onrender.com/api/logsheet/?trip_id=${tripData.id}`,
            { responseType: 'blob' }
          )
          const blob = new Blob([response.data], { type: 'application/pdf' })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', `logsheet_trip_${tripData.id}.pdf`)
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        } catch (error) {
          console.error("Error downloading logsheet:", error)
        }
      }
      
    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-3xl font-bold text-center text-blue-600">Trip Planner & ELD Log Generator</h1>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  {isFallbackMode ? (
                    <LocationSearch
                      label="Current Location (Manual Entry)"
                      onSelect={(loc) => {
                        setCurrentLocationCoords({ lat: loc.lat, lon: loc.lon })
                        setCurrentLocationAddress(loc.displayName)
                      }}
                    />
                  ) : (
                    <div>
                      <label className="block text-gray-700">Current Location</label>
                      <p className="w-full text-gray-700 p-2 bg-gray-200 rounded-md">{currentLocationAddress || "Fetching current location..."}</p>
                    </div>
                  )}
                </div>
                <br />
                <div>
                    <LocationSearch
                        label="Pickup Location"
                        onSelect={(loc) => setPickupLocation(loc)}
                    />
                </div>
                <div>
                    <LocationSearch
                        label="Dropoff Location"
                        onSelect={(loc) => setDropoffLocation(loc)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Current Cycle Hours
                        <input
                            type="number"
                            value={currentCycleHours}
                            onChange={e => setCurrentCycleHours(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        />
                    </label>
                </div>
                <br />
                <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition">Plan Trip</button>
            </form>

            {routeData && (
                <div className="mt-8">
                    <h2 className="text-xl font-bold text-blue-600">Route Map</h2>
                    <MapComponent routeData={routeData} stops={stops} initialCenter={initialCenter} />
                </div>
            )}

            {tripData && (
                <div className="mt-8">
                    <h2 className="text-xl font-bold text-blue-600">Driver's Daily Log</h2>
                    <button onClick={downloadLogSheet} className="w-full bg-green-600 text-white p-2 rounded-md hover:bg-green-700 transition">Download ELD Logsheet</button>
                </div>
            )}
            </div>
        </div>
    )
}
