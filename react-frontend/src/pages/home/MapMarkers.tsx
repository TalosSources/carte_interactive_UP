import React from 'react'
import { GeoBoundingBox } from '../../lib/BoundingBox'
import { useFilteredInitiatives } from '../../lib/KesApi'
import { MapMarker } from './MapMarker'

export function MapMarkers ({ tags, searchQuery, bb }: { tags: string[], searchQuery: string, bb: GeoBoundingBox | 'Hide global' | 'Show all' }): React.JSX.Element {
  const initiatives = useFilteredInitiatives(tags, searchQuery, bb)
  return <>
    {initiatives.map((initiative) => initiative.locations.features.map((feature, index) => <MapMarker key={`${initiative.id}_${index}`} initiative={initiative} feature={feature} index={index} />
    )
    ).flat(1)}
  </>
}
