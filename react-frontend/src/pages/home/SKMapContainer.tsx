import React, { Suspense, useContext, useEffect } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvent } from 'react-leaflet'
import L, { LatLngBounds, Map, type LeafletEvent } from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
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

function RegisterMapCenter ({ setMapBounds }: { setMapBounds: (newBounds: LatLngBounds) => void }): null {
  const [, setParams] = useSearchParams()
  useMapEvent('moveend', (e: LeafletEvent) => {
    const map: Map = e.target
    const newBounds = map.getBounds()
    const zoom = map.getZoom()
    const center = map.getCenter()
    const { lat, lng } = center

    setParams((prev) => {
      prev.set('zoom', zoom.toString())
      prev.set('lat', lat.toFixed(4))
      prev.set('lng', lng.toFixed(4))
      return prev
    })

    setMapBounds(newBounds)
  })
  const map = useMap()
  useEffect(() => {
    setMapBounds(map.getBounds())
  }, [])
  return null
}

export function CIMapContainer ({ setMapBounds, tags, searchQuery }: { setMapBounds: (newBounds: LatLngBounds) => void, tags: string[], searchQuery: string }): React.JSX.Element {
  const { lat, lng, zoom } = useMapStateParam().valueOr({ lat: 46.523, lng: 6.618, zoom: 12 })

  return <MapContainer
    id="map"
    center={[lat, lng]}
    zoom={zoom}
    scrollWheelZoom={false}
  >
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <RegisterMapCenter setMapBounds={setMapBounds}/>
    <ZoomMapToRegion />
    <MarkerClusterGroup chunkedLoading maxClusterRadius={40}>
      <Suspense fallback={<></>}>
        <MapMarkers tags={tags} searchQuery={searchQuery} />
      </Suspense>
    </MarkerClusterGroup>
  </MapContainer>
}

// Zoom-situations
// 1. opens SK without coords. -> zoom to region
// 2. follows link with location -> go to loc
// 3. goes back in history -> go to loc
// 4. opens freshly, but starts panning before data loaded -> stay
// 5. has been on map, changes city -> zoom to new city
// 6. clicks on home-button. -> region stays same, location vanishes -> zoom to region
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
