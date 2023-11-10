import React from 'react'
import { Link } from 'react-router-dom'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useTranslation } from 'react-i18next'
import { type Feature, type Initiative } from '../../lib/KesApi'

export function MapMarker ({ initiative, feature, index }: { initiative: Initiative, feature: Feature, index: number }): React.JSX.Element {
  const { t } = useTranslation()
  const title = t('initiatives.' + initiative.slug + '.title')
  const icon: L.Icon<L.Icon.DefaultIconOptions> = new L.Icon.Default({ iconUrl: '/marker-icon.png' })
  return <Marker
    key={`m_${initiative.id}_${index}`}
    position={{ lat: feature.geometry.coordinates[1], lng: feature.geometry.coordinates[0] }}
    title={title}
    icon={icon}
  >
    <Popup>
      <Link to={'/details/' + initiative.slug}>{title}</Link>
    </Popup>
  </Marker>
}
