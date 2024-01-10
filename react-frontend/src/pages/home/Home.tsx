// React
import React, { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { createBrowserHistory } from '@remix-run/router'

// Map
import 'leaflet/dist/leaflet.css'
import 'leaflet-gesture-handling/dist/leaflet-gesture-handling.css'
import L from 'leaflet'
import GestureHandling from 'leaflet-gesture-handling'

import { GeoCoordinate } from '../../lib/Coordinate'
import { GeoBoundingBox } from '../../lib/BoundingBox'

import { buildUrl } from 'build-url-ts'

// Constants
import { SMALL_SCREEN_WIDTH } from '../../lib/constants'
import { type Region } from '../../lib/KesApi'
import { QueryBoundaries } from '../../lib/QueryBoundary'
import { SearchBox } from './SearchBox'
import { SKMapContainer } from './SKMapContainer'
import { MainCardList } from './MainCardList'

const Header = styled.header`
    padding-top: 2rem;
    display: flex;
    flex-direction: column
    align-items: center;
    margin: auto;
    width: 80vw;

    h1 {
        font-weight: bold;
    }
    
`

const MainContainer = styled.div`
    padding-top: 10px;
    border-radius: 20px;
    display: flex: 
    flex-directon: column;
    @media (max-width: ${SMALL_SCREEN_WIDTH}px) {
        margin-left: 0;
        margin-right: 0;
        padding: 1rem;
        margin-top: 2rem;
    }

    `
export const SearchRow = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 0.5rem;
    width: 100vw;
`

export const TagContainer = styled.div`
    overflow-x: scroll;

`

export const Sorting = {
  Alphabetical: { value: '1', text: 'ui.sortAlpha' },
  Distance: { value: '2', text: 'ui.sortByDist' }
}

const WhatToShow = {
  Everything: { value: '1', text: 'ui.allInitiatives' },
  OnlyOnMap: { value: '2', text: 'ui.onlyOnTheMap' },
  WithoutGlobal: { value: '3', text: 'ui.hideGlobal' }
}

class EnabledGestureHandling extends GestureHandling {
  constructor (arg: L.Map) {
    super(arg)
    this.enable()
  }
}

L.Map.addInitHook('addHandler', 'gestureHandling', EnabledGestureHandling)
L.Icon.Default.imagePath = '/'

export default function Home (
  { regionList, setRegionSlug, regionSlug }: { regionList: Region[], setRegionSlug: (slug: string) => void, regionSlug: string }): React.JSX.Element {
  const [queryParameters] = useSearchParams()
  const { regionSlugP } = useParams()

  useEffect(() => {
    if (typeof regionSlugP !== 'undefined') {
      setRegionSlug(regionSlugP)
    }
  }, [regionSlugP])
  let urlSearchString
  if (queryParameters.has('s')) {
    urlSearchString = queryParameters.get('s')
    if (urlSearchString == null) {
      urlSearchString = ''
    }
  } else {
    urlSearchString = ''
  }
  const [searchString, setSearchString] = useState(urlSearchString)
  // const [activeRegion, setActiveRegion] = useState({properties: { welcome_message_html: ""}});
  const [mapCenter, setMapCenter] = useState(new GeoCoordinate({ latitude: 50, longitude: 12 }))
  const [mapBounds, setMapBounds] = useState(new GeoBoundingBox())

  const sorting = Sorting.Distance.value
  const initiativesToShow = WhatToShow.OnlyOnMap.value

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [regionSlug])

  useEffect(() => {
    const history = createBrowserHistory()
    const queryParams: Record<string, string | string[]> = {}
    if (searchString !== '') {
      queryParams.s = searchString
    }
    const newUrl = buildUrl({
      path: '/r/' + regionSlug,
      queryParams
    })
    history.replace(newUrl)
  }, [searchString, regionSlugP, regionSlug])

  // refresh region
  const region = regionList.filter((r: Region) => r.properties.slug === regionSlug)
  let activeReg
  if (region.length === 0) {
    activeReg = {
      properties: {
        welcome_message_html: ''
      }
    }
  } else {
    activeReg = region[0]
  }

  let bb: GeoBoundingBox | 'Show all' | 'Hide global' = mapBounds
  if (initiativesToShow === WhatToShow.Everything.value) {
    bb = 'Show all'
  } else if (initiativesToShow === WhatToShow.WithoutGlobal.value) {
    bb = 'Hide global'
  }

  return <><SKMapContainer setMapBounds={setMapBounds} setMapCenter={setMapCenter} searchQuery={searchString} bb={bb} tags={[]}/>

            <Suspense fallback={<></>}>
            <Header>
                {(() => (
                    <div id="welcomeMessage" dangerouslySetInnerHTML={{ __html: activeReg.properties.welcome_message_html }} />
                ))()}
            </Header>
            </Suspense>

            <MainContainer>
                <SearchBox setQuery={setSearchString} initialSearch={urlSearchString}/>
                <QueryBoundaries>
                    <MainCardList tags={[]} searchQuery={searchString} bb={bb} sorting={sorting} mapCenter={mapCenter}/>
                </QueryBoundaries>
                <div id="helpUsBox">
                <a href="https://smartakartan.se/starta-verksamhet">
                    <img src='/hjälpaOss.jpg' />
                </a></div>
            </MainContainer></>
}
