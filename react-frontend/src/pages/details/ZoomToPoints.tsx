import L from 'leaflet'
import { type Initiative, initiativeLocationFeatureToGeoCoordinate } from '../../lib/KesApi'
import { useMap } from 'react-leaflet'

export function ZoomToPoints ({ initiative }: { initiative: Initiative }): null {
  if (initiative.locations.features.length === 0) {
    return null
  }
  const bb = L.latLngBounds(initiative.locations.features.map((feature) => initiativeLocationFeatureToGeoCoordinate(feature)))
  const map = useMap()
  map.fitBounds(bb)
  return null
}
