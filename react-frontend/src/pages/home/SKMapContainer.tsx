import React, { Suspense, useContext, useEffect } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvent } from 'react-leaflet'
import L, { LatLngExpression, type LeafletEvent } from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { GeoCoordinate } from '../../lib/Coordinate'
import { GeoBoundingBox } from '../../lib/BoundingBox'
import { MapMarkers } from './MapMarkers'
import { useSearchParams } from 'react-router-dom'
import { RegionContext } from '../../components/RegionContext'

export function SKMapContainer ({ setMapCenter, setMapBounds, tags, searchQuery, bb }: { setMapCenter: (newCenter: GeoCoordinate) => void, setMapBounds: (newBounds: GeoBoundingBox) => void, tags: string[], searchQuery: string, bb: GeoBoundingBox | 'Hide global' | 'Show all' }): React.JSX.Element {
  function leafletToGeoCoordinate (leafletCoordinate: { lng: number, lat: number }): GeoCoordinate {
    return new GeoCoordinate({ longitude: leafletCoordinate.lng, latitude: leafletCoordinate.lat })
  }
  const [params, setParams] = useSearchParams()

  function RegisterMapCenter (): null {
    useMapEvent('moveend', (e: LeafletEvent) => {
      const newBounds = e.target.getBounds()
      const zoom = e.target.getZoom()
      const center = e.target.getCenter()
      const { lat, lng } = center

      setParams((prev) => {
        prev.set('zoom', zoom)
        prev.set('lat', lat.toFixed(2))
        prev.set('lng', lng.toFixed(2))
        return prev
      })

      setMapCenter(leafletToGeoCoordinate(center))
      setMapBounds(GeoBoundingBox.fromCoordinates([
        leafletToGeoCoordinate(newBounds._northEast),
        leafletToGeoCoordinate(newBounds._southWest)
      ]
      ))
    })
    return null
  }

  const lat = params.get('lat')
  const lng = params.get('lng')
  const zoom = params.get('zoom')

  const center: LatLngExpression | undefined = lat !== null && lng !== null ? [parseFloat(lat), parseFloat(lng)] : undefined

  const parsedZoom = zoom !== null ? parseInt(zoom) : undefined
  return <MapContainer
    id="map"
    center={center ?? [59, 15]}
    zoom={parsedZoom ?? 6}
    scrollWheelZoom={false}
  >
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <RegisterMapCenter />
    <ZoomMapToRegion />
    <MarkerClusterGroup chunkedLoading maxClusterRadius={40}>
      <Suspense fallback={<></>}>
        <MapMarkers tags={tags} searchQuery={searchQuery} bb={bb} />
      </Suspense>
    </MarkerClusterGroup>
  </MapContainer>
}

function ZoomMapToRegion (): null {
  const region = useContext(RegionContext)
  const map = useMap()
  useEffect(() => {
    const gisBoundaryCoords = region?.geometry.coordinates[0] ?? []

    if (gisBoundaryCoords.length > 0) {
      const leafletBoundaryCoords = gisBoundaryCoords.map(coordinate => L.latLng({ lat: coordinate[1], lng: coordinate[0] }))
      const bb = L.latLngBounds(leafletBoundaryCoords)
      map.flyToBounds(bb)
    }
  }, [region])
  return null
}
