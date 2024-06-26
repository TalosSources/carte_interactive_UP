import React from 'react'
import { type Feature, type Initiative } from '../../lib/KesApi'
import L from 'leaflet'
import { Marker, Popup } from 'react-leaflet'

export function renderMapMarkers (initiative: Initiative): React.JSX.Element[] {
  const icon: L.Icon<L.Icon.DefaultIconOptions> = new L.Icon.Default({ iconUrl: '/marker-icon.png' })
  function feature2Marker (feature: Feature, index: number): React.JSX.Element {
    const title = feature.properties.title
    return (
      <Marker
        key={`m_${index}`}
        position={[feature.geometry.coordinates[1], feature.geometry.coordinates[0]]}
        title={title}
        icon={icon}
      >
        <Popup>
          {title}
        </Popup>
      </Marker>
    )
  }

  return initiative.locations.features.map((feature, index) => feature2Marker(feature, index))
}
