import React, { Suspense, useContext } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvent } from 'react-leaflet'
import L, { type LeafletEvent } from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { GeoCoordinate } from '../../lib/Coordinate'
import { GeoBoundingBox } from '../../lib/BoundingBox'
import { MapMarkers } from './MapMarkers'
import { useSearchParams } from 'react-router-dom'
import { RegionContext } from '../../components/RegionContext'
import { Maybe } from 'typescript-monads'
import { intoMaybe } from '../../components/NullableMonad'

function useMapStateParam (): Maybe<{ lat: number, lng: number, zoom: number }> {
  const [params] = useSearchParams()
  const lat = intoMaybe(params.get('lat')).map(parseFloat)
  const lng = intoMaybe(params.get('lng')).map(parseFloat)
  const zoom = intoMaybe(params.get('zoom')).map(parseFloat)

  return lat.flatMap((lat) =>
    lng.flatMap((lng) =>
      zoom.map((zoom) => {
        return { lat, lng, zoom }
      })))
}

export function SKMapContainer ({ setMapCenter, setMapBounds, tags, searchQuery, bb }: { setMapCenter: (newCenter: GeoCoordinate) => void, setMapBounds: (newBounds: GeoBoundingBox) => void, tags: string[], searchQuery: string, bb: GeoBoundingBox | 'Hide global' | 'Show all' }): React.JSX.Element {
  function leafletToGeoCoordinate (leafletCoordinate: { lng: number, lat: number }): GeoCoordinate {
    return new GeoCoordinate({ longitude: leafletCoordinate.lng, latitude: leafletCoordinate.lat })
  }
  const [, setParams] = useSearchParams()

  function RegisterMapCenter (): null {
    useMapEvent('moveend', (e: LeafletEvent) => {
      const newBounds = e.target.getBounds()
      const zoom = e.target.getZoom()
      const center = e.target.getCenter()
      const { lat, lng } = center

      setParams((prev) => {
        prev.set('zoom', zoom)
        prev.set('lat', lat.toFixed(4))
        prev.set('lng', lng.toFixed(4))
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
  const { lat, lng, zoom } = useMapStateParam().valueOr({ lat: 59, lng: 15, zoom: 6 })

  return <MapContainer
    id="map"
    center={[lat, lng]}
    zoom={zoom}
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

// Zoom-situations
// 1. opens SK without coords. -> zoom
// 2. follows link with location -> go to loc
// 3. goes back in history -> go to loc
// 4. opens freshly, but starts panning before data loaded -> stay
// 5. has been on map, changes city -> zoom to new city
// 6. clicks on home-button. -> region stays same, location vanishes -> zoom
function ZoomMapToRegion (): null {
  // useEffect([region]) doesn't work here, because we want a click on the symbol leading to /r/currentSlug to reset zoom
  const region = useContext(RegionContext)
  const map = useMap()

  const mapStateParam = useMapStateParam()

  if (mapStateParam.isNone()) {
    const gisBoundaryCoords = region?.geometry.coordinates[0] ?? []

    if (gisBoundaryCoords.length > 0) {
      const leafletBoundaryCoords = gisBoundaryCoords.map(coordinate => L.latLng({ lat: coordinate[1], lng: coordinate[0] }))
      const bb = L.latLngBounds(leafletBoundaryCoords)
      map.flyToBounds(bb)
    }
  }
  return null
}
