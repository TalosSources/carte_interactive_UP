import React from 'react'
import { useFilteredInitiatives } from '../../lib/KesApi'
import { MapMarker } from './MapMarker'
import { useMap } from 'react-leaflet'

export function MapMarkers ({ tags, searchQuery }: { tags: string[], searchQuery: string }): React.JSX.Element {
  const map = useMap()
  const bb = map.getBounds()
  const initiatives = useFilteredInitiatives(tags, searchQuery, bb)
  return <>
    {initiatives.map((initiative) => initiative.locations.features.map((feature, index) => <MapMarker key={`${initiative.id}_${index}`} initiative={initiative} feature={feature} index={index} />
    )
    ).flat(1)}
  </>
}
