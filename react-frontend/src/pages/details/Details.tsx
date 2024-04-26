import React, { useEffect, Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { renderCards } from '../../components/Cards'
import { type Initiative, matchTagsWithInitiatives, type Tag, useInitiative, useInitiatives, useTags } from '../../lib/KesApi'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import { MapContainer, TileLayer } from 'react-leaflet'
import styled from 'styled-components'
import { getDescription, getTitle } from '../../lib/i18n'
import { renderMapMarkers } from './renderMapMarkers'
import { ZoomToPoints } from './ZoomToPoints'

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

function SocialLink ({ url, faSymbol, key_, ariaLabel }: { url: string | null, faSymbol: string, key_: string, ariaLabel: string }): React.JSX.Element {
  if (url === null) {
    return <></>
  }
  if (url !== '') {
    return <li key={key_} className="list-group-item p-0 border-0">
            <a href={url} target="_blank" className="pr-3" aria-label={ariaLabel} rel="noreferrer">
              <i className={'fa ' + faSymbol} aria-hidden="true" /> Webbplats
            </a>
        </li>
  }
  return <></>
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
          if (initiative.state !== 'p') {
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
                          <SocialLink url={initiative.homepage} faSymbol="fa-link" ariaLabel='website link' key_='details-homepage'/>
                          <SocialLink url={initiative.mail} faSymbol='fa-envelope' ariaLabel='email' key_='details-mail' />
                          <SocialLink url={initiative.phone} faSymbol='fa-phone' ariaLabel='phone' key_='details-phone' />
                          <SocialLink url={initiative.instagram} faSymbol='fa-instagram' ariaLabel='instagram link' key_='details-instagram' />
                          <SocialLink url={initiative.facebook} faSymbol='fa-facebook' ariaLabel='facebook link' key_='details-facebook' />
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
