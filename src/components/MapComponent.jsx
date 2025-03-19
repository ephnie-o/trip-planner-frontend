import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet'

const MapComponent = ({ routeData, stops, initialCenter }) => {
  return (
    <MapContainer center={initialCenter} zoom={6} style={{ height: '400px', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {routeData && routeData.coordinates && (
        <Polyline positions={routeData.coordinates.map(coord => [coord[1], coord[0]])} />
      )}
      {stops && stops.map((stop, index) => (
        <Marker key={index} position={[stop.location_lat, stop.location_lon]}>
          <Popup>
            {stop.type} <br /> Duration: {stop.duration_minutes} minutes
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

export default MapComponent
