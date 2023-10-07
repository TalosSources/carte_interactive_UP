import type React from 'react'
import { useEffect, Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { renderCards } from '../Cards'
import { type Feature, type Initiative, matchTagsWithInitiatives, type Tag, useInitiative, useInitiatives, useTags, initiativeLocationFeatureToGeoCoordinate } from '../KesApi'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { GeoBoundingBox } from '../BoundingBox'
import styled from 'styled-components'
import { getDescription, getTitle } from '../i18n'

const DetailsMainImage = styled.img`
    height: 20em;
    object-fit: cover;
`
const DetailsMapView = styled.div`
    height: 20em;
`

L.Icon.Default.imagePath = '/'
function renderTags (initiative: Initiative, tagsByInitiatives: Map<string, Tag[]>): React.JSX.Element {
  return <div id="tagPanel">
    {
        tagsByInitiatives.get(initiative.slug)?.map((tagElement) => (
            <a key={`tag=${tagElement.slug}`} href={`/?t=${tagElement.slug}`}>
            <div className="proposedTag">
                <div dangerouslySetInnerHTML={{ __html: tagElement.title }}></div>
            </div></a>
        ))
    }</div>
}

export default function Details (): React.JSX.Element {
  const { initiativeSlug } = useParams()
  if (typeof initiativeSlug === 'undefined') {
    throw Error('Unknown initiative')
  }

  const initiatives = useInitiatives()
  const tags = useTags()
  const initiative = useInitiative(initiativeSlug)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [initiativeSlug])

  const similarInitiatives = initiatives
    .map(function (initiativeB): [number, Initiative] {
      return [
        initiative.tags.filter(tagA => initiativeB.tags.some(tagB => tagA === tagB)).length,
        initiativeB
      ]
    })
  // [number of equal tags, initiative]
    .filter(initiativeCountOfEqualTags => initiativeCountOfEqualTags[0] > 0)
    .sort((initiativeAndCount1, initiativeAndCount2) => initiativeAndCount2[0] - initiativeAndCount1[0])
    .slice(1, 6)
    .map(initiativeAndCount => initiativeAndCount[1])
  const taggedInitiativMatching = matchTagsWithInitiatives(initiatives, tags)
  const renderedCards = renderCards(similarInitiatives)

  const { t } = useTranslation()
  const mapMarkers = renderMapMarkers(initiative)
  return (
        <>
        {(() => {
          if (!(initiative.state === 'p')) {
            return <div className="alert alert-danger" role="alert">
                    {t('ui.unpublishedWarning')}
                </div>
          }
        })()}
        <div className="row business-page">
            <Suspense>
            <div className="col-md-8">
                <article>
                    <DetailsMainImage className="col-md-8 img img-fluid" src={initiative.main_image_url}/>
                    <div className="business-header">
                        <h1>{getTitle(initiative)}</h1>
                        <a title="Edit initiative" id="edit-button" href={'/admin/website/initiative/' + initiative.id.toString() + '/change/'}><div id="pen">✎</div></a><br/>
                    </div>
                    <div className="btn-group mb-1 mt-2" role="group" aria-label="Link list">
                        <ul className="list-group list-group-horizontal-sm">
                            {(() => {
                              if (initiative.homepage !== '') {
                                return <li key="details-homepage" className="list-group-item p-0 border-0">
                                        <a href={initiative.homepage} target="_blank" className="pr-3" aria-label="website link" rel="noreferrer">
                                            <i className="fa fa-link" aria-hidden="true"></i> Webbplats
                                        </a>
                                    </li>
                              }
                            })()}
                            {(() => {
                              if (initiative.mail !== '') {
                                return <li key="details-mail" className="list-group-item p-0 border-0">
                                        <a href={'mailto:' + initiative.mail} className="pr-3" aria-label="email">
                                            <i className="fa fa-envelope" aria-hidden="true"></i> E-postadress
                                        </a>
                                    </li>
                              }
                            })()}
                            {(() => {
                              if (initiative.phone !== '') {
                                return <li key="details-phone" className="list-group-item p-0 border-0">
                                        <a href={'tel:' + initiative.phone} className="pr-3" aria-label="phone">
                                            <i className="fa fa-phone" aria-hidden="true"></i> Phone
                                        </a>
                                    </li>
                              }
                            })()}
                            {(() => {
                              if (initiative.instagram !== '') {
                                return <li key="details-instagram" className="list-group-item p-0 border-0">
                                        <a href={'https://www.instagram.com/' + initiative.instagram} target="_blank" className="pr-3" aria-label="instagram link" rel="noreferrer">
                                            <i className="fa fa-instagram" aria-hidden="true"></i> Instagram
                                        </a>
                                    </li>
                              }
                            })()}
                            {(() => {
                              if (initiative.facebook !== '') {
                                return <li key="details-facebook" className="list-group-item p-0 border-0">
                                        <a href={initiative.facebook} target="_blank" className="pr-3" aria-label="facebook link" rel="noreferrer">
                                            <i className="fa fa-facebook" aria-hidden="true"></i> Facebook
                                        </a>
                                    </li>
                              }
                            })()}
                        </ul>
                    </div>
                    <p dangerouslySetInnerHTML={{ __html: getDescription(initiative) }}></p>
                </article>
            </div>
            <div className="col-md-4">
                {(() => {
                  if (initiative.locations.features.length > 0) {
                    return <DetailsMapView>
                    <MapContainer
                        id="details-map"
                        center={[59, 15]}
                        zoom={6}
                        scrollWheelZoom={false}
                        key={initiative.slug}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                        <ZoomToPoints initiative={initiative}/>
                        {mapMarkers}
                    </MapContainer>
                    </DetailsMapView>
                  }
                }
                )()}
                <h4>{initiative.area}</h4>
                <ul>
                {initiative.locations.features.map((feature) => <li key={`locationkey${feature.properties.title}`}>{feature.properties.title}</li>)}
                </ul>
                {renderTags(initiative, taggedInitiativMatching)}
            </div></Suspense>
            {(() => {
              if (similarInitiatives.length > 0) {
                return <div id="suggestions">
                        <h3>You may also like</h3>
                        <div id="similarInitiativesCanvas" className="card-group">
                            {renderedCards}
                        </div>
                    </div>
              }
            })()}
        </div></>
  )
}

function ZoomToPoints ({ initiative }: { initiative: Initiative }): null {
  if (initiative.locations.features.length === 0) {
    return null
  }
  const bb = GeoBoundingBox.fromCoordinates(initiative.locations.features.map((feature) => initiativeLocationFeatureToGeoCoordinate(feature)))
  const map = useMap()
  map.fitBounds([
    [bb.getTopLeft().getLatitude(), bb.getTopLeft().getLongitude()],
    [bb.getBottomRight().getLatitude(), bb.getBottomRight().getLongitude()]
  ])
  return null
}

function renderMapMarkers (initiative: Initiative): React.JSX.Element[] {
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
                    {feature.properties.title}
                </Popup>
            </Marker>
    )
  }

  return initiative.locations.features.map((feature, index) => feature2Marker(feature, index))
}
