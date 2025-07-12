import React, { useState } from 'react'
import { renderCardCollection } from '../../components/Cards'
import { useTranslation } from 'react-i18next'
import { type Initiative, initiativeLocationFeatureToGeoCoordinate, useFilteredInitiatives } from '../../lib/KesApi'
import { Button } from 'react-bootstrap'
import { Sorting } from './Home'
import { LatLngBounds } from 'leaflet'
import { getTitle } from '../../lib/i18n'
import SeedRandom from '../../lib/random'

// Home Components
export function MainCardList ({ tags, searchQuery, bb, sorting }: { tags: string[], searchQuery: string, bb: LatLngBounds, sorting: string }): React.JSX.Element {
  if (!bb || !bb.isValid()) {
    return (
      <>
        Loading...
      </>
    )
  }
  function sortInitiativesByName (initiatives: Initiative[]): Initiative[] {
    const names: Array<[number, string]> = []
    for (let i = 0; i < initiatives.length; i++) {
      names.push([i, getTitle(initiatives[i])])
    }

    names.sort((left, right) => left[1] < right[1] ? -1 : 1)

    const sortedInitiatives = []

    for (let i = 0; i < initiatives.length; i++) {
      sortedInitiatives.push(initiatives[names[i][0]])
    }

    return sortedInitiatives
  }

  function sortInitiativesByDistanceToCenter (initiatives: Initiative[], seed: string): Initiative[] {
    function initiativeDistanceFromMapCenter (initiative: Initiative): number {
      if (initiative.locations.features.length === 0) {
        return 0
      }
      return Math.min(...initiative.locations.features.map(
        feature => bb.getCenter().distanceTo(initiativeLocationFeatureToGeoCoordinate(feature))
      ))
    }
    const rng = new SeedRandom(seed)
    const initiativesPhysical: Initiative[] = []
    const initiativesOnline: Initiative[] = []

    // Separate initiatives into two groups
    for (const initiative of initiatives) {
      if (initiative.locations.features.length === 0) {
        initiativesOnline.push(initiative)
      } else {
        initiativesPhysical.push(initiative)
      }
    }

    // Calculate distances for initiatives with locations
    const distances = initiativesPhysical.map((initiative, index) => [index, initiativeDistanceFromMapCenter(initiative)])

    // Sort initiatives with locations by distance
    distances.sort((left, right) => left[1] < right[1] ? -1 : 1)

    // Create sorted list of initiatives with locations
    const sortedInitiatives = distances.map(distance => initiativesPhysical[distance[0]])

    // Randomly insert initiatives without locations into the sorted list
    for (const initiative of initiativesOnline) {
      const randomIndex = Math.floor(rng.next() * (sortedInitiatives.length + 1))
      sortedInitiatives.splice(randomIndex, 0, initiative)
    }
    return sortedInitiatives
  }
  const { t } = useTranslation()

  const [numberOfCards, setNumberOfCards] = useState<number>(16)

  let initiatives = useFilteredInitiatives(tags, searchQuery, bb)
  if (sorting === Sorting.Distance.value) {
    const seed = 'seed'
    console.log(2)
    initiatives = sortInitiativesByDistanceToCenter(initiatives, seed)
    console.log(3)
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
