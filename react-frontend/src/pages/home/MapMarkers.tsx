import React from 'react'
import { useFilteredInitiatives } from '../../lib/KesApi'
import { MapMarker } from './MapMarker'
import { LatLngBounds } from 'leaflet'

export function MapMarkers ({ tags, searchQuery, bb }: { tags: string[], searchQuery: string, bb: LatLngBounds }): React.JSX.Element {
  const initiatives = useFilteredInitiatives(tags, searchQuery, bb)
  return <>
    {initiatives.map((initiative) => initiative.locations.features.map((feature, index) => <MapMarker key={`${initiative.id}_${index}`} initiative={initiative} feature={feature} index={index} />
    )
    ).flat(1)}
  </>
}
