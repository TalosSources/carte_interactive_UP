import React, { useState } from 'react'
import { renderCardCollection } from '../../components/Cards'
import { useTranslation } from 'react-i18next'
import { type Initiative, initiativeLocationFeatureToGeoCoordinate, useFilteredInitiatives } from '../../lib/KesApi'
import { Button } from 'react-bootstrap'
import { Sorting } from './Home'
import { LatLng, LatLngBounds } from 'leaflet'

// Home Components
export function MainCardList ({ tags, searchQuery, bb, sorting, mapCenter }: { tags: string[], searchQuery: string, bb: LatLngBounds, sorting: string, mapCenter: LatLng }): React.JSX.Element {
  function sortInitiativesByName (initiatives: Initiative[]): Initiative[] {
    const names: Array<[number, string]> = []
    for (let i = 0; i < initiatives.length; i++) {
      names.push([i, t('initiatives.' + initiatives[i].slug + '.title')])
    }

    names.sort((left, right) => left[1] < right[1] ? -1 : 1)

    const sortedInitiatives = []

    for (let i = 0; i < initiatives.length; i++) {
      sortedInitiatives.push(initiatives[names[i][0]])
    }

    return sortedInitiatives
  }

  function sortInitiativesByDistanceToCenter (initiatives: Initiative[]): Initiative[] {
    function initiativeDistanceFromMapCenter (initiative: Initiative): number {
      if (initiative.locations.features.length === 0) {
        return 0
      }
      return Math.min(...initiative.locations.features.map(
        feature => mapCenter.distanceTo(initiativeLocationFeatureToGeoCoordinate(feature))
      ))
    }

    const distances = []

    for (let i = 0; i < initiatives.length; i++) {
      distances.push([i, initiativeDistanceFromMapCenter(initiatives[i])])
    }

    distances.sort((left, right) => left[1] < right[1] ? -1 : 1)

    const sortedInitiatives = []

    for (let i = 0; i < initiatives.length; i++) {
      sortedInitiatives.push(initiatives[distances[i][0]])
    }

    return sortedInitiatives
  }
  const { t } = useTranslation()

  const [numberOfCards, setNumberOfCards] = useState<number>(16)

  let initiatives = useFilteredInitiatives(tags, searchQuery, bb)
  if (sorting === Sorting.Distance.value) {
    initiatives = sortInitiativesByDistanceToCenter(initiatives)
  } else if (sorting === Sorting.Alphabetical.value) {
    initiatives = sortInitiativesByName(initiatives)
  }
  const renderedCards = renderCardCollection(initiatives.slice(0, numberOfCards))

  return (
    <>
      <div id="cards-canvas">{renderedCards}</div>
      {(initiatives.length > numberOfCards) &&
        <div id="centerContainer">
          <Button
            id="loadMoreCardsButton"
            onClick={() => { setNumberOfCards(numberOfCards + 16) }}>
            {t('ui.loadMoreCards')}
          </Button>
        </div>}
    </>
  )
}
