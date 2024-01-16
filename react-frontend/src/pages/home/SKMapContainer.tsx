import React, { Suspense, useContext } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvent } from 'react-leaflet'
import L, { LatLng, LatLngBounds, type LeafletEvent } from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { MapMarkers } from './MapMarkers'
import { useSearchParams } from 'react-router-dom'
import { RegionContext } from '../../components/RegionContext'
import { IMaybe, Maybe } from 'typescript-monads'

function maybeFromNullable<T> (t: T | null | undefined): IMaybe<T> {
  if (typeof t === 'undefined') {
    return Maybe.none()
  }
  if (t === null) {
    return Maybe.none()
  }
  return Maybe.some(t)
}

function useMapStateParam (): Maybe<{ lat: number, lng: number, zoom: number }> {
  const [params] = useSearchParams()
  const lat = maybeFromNullable(params.get('lat')).map(parseFloat)
  const lng = maybeFromNullable(params.get('lng')).map(parseFloat)
  const zoom = maybeFromNullable(params.get('zoom')).map(parseFloat)

  return lat.flatMap((lat) =>
    lng.flatMap((lng) =>
      zoom.map((zoom) => {
        return { lat, lng, zoom }
      })))
}

export function SKMapContainer ({ setMapCenter, setMapBounds, tags, searchQuery, bb }: { setMapCenter: (newCenter: LatLng) => void, setMapBounds: (newBounds: LatLngBounds) => void, tags: string[], searchQuery: string, bb: LatLngBounds }): React.JSX.Element {
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

      setMapCenter(center)
      setMapBounds(L.latLngBounds([newBounds._northEast, newBounds._southWest]))
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
