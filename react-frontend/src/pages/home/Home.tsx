// React
import React, { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { createBrowserHistory } from '@remix-run/router'

// Map
import 'leaflet/dist/leaflet.css'
import GestureHandling from 'leaflet-gesture-handling'
import 'leaflet-gesture-handling/dist/leaflet-gesture-handling.css'
import L from 'leaflet'

import { GeoCoordinate } from '../../lib/Coordinate'
import { GeoBoundingBox } from '../../lib/BoundingBox'

import SelectFromObject from './SelectFromObject'

import { buildUrl } from 'build-url-ts'

// Constants
import { SMALL_SCREEN_WIDTH } from '../../lib/constants'
import { fetchTags, type Region, type Tag } from '../../lib/KesApi'
import { QueryBoundaries } from '../../lib/QueryBoundary'
import { TagBar } from './TagBar'
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
  let urlActiveTags: string[]
  const activeTagsPart = queryParameters.get('t')
  if (!(activeTagsPart == null) && !(activeTagsPart === '')) {
    urlActiveTags = activeTagsPart.split(',')
  } else {
    urlActiveTags = []
  }
  const [searchString, setSearchString] = useState(urlSearchString)
  // const [activeRegion, setActiveRegion] = useState({properties: { welcome_message_html: ""}});
  const [activeTags, setActiveTags] = useState<string[]>(urlActiveTags)
  const [mapCenter, setMapCenter] = useState(new GeoCoordinate({ latitude: 50, longitude: 12 }))
  const [mapBounds, setMapBounds] = useState(new GeoBoundingBox())
  const [sorting, setSorting] = useState(Sorting.Distance.value)
  const [initiativesToShow, setInitiativesToShow] = useState(WhatToShow.Everything.value)
  const [tags, setTags] = useState<Tag[]>([])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [regionSlug])

  useEffect(() => {
    const history = createBrowserHistory()
    const queryParams: Record<string, string | string[]> = {}
    if (searchString !== '') {
      queryParams.s = searchString
    }
    if (activeTags.length > 0) {
      queryParams.t = activeTags
    }
    const newUrl = buildUrl({
      path: '/r/' + regionSlug,
      queryParams
    })
    history.replace(newUrl)
  }, [activeTags, searchString, regionSlugP, regionSlug])

  useEffect(() => {
    // fetch tags
    fetchTags()
      .then(responseJson => {
        const tags = responseJson.map((tag: Tag) => {
          tag.title = tag.title.replace('&amp;', '&')
          return tag
        })
        setTags(tags)
        // remove invalid strings in activeTags
      })
      .catch(() => {
        console.log('Error while fetching tags in Home.')
      })
  }, [])

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

  return <><SKMapContainer setMapBounds={setMapBounds} setMapCenter={setMapCenter} searchQuery={searchString} bb={bb} tags={activeTags}/>

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
                    <TagBar tags={tags} urlActiveTags={urlActiveTags} setHomeTags={setActiveTags} searchQuery={searchString} bb={bb}/>

                    <div id="filters">
                                    <SelectFromObject
                        obj={WhatToShow}
                        defaultValue={WhatToShow.Everything.value}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setInitiativesToShow(e.target.value) }}
                                    />
                                    <SelectFromObject
                        obj={Sorting}
                        defaultValue={Sorting.Distance.value}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setSorting(e.target.value) }}
                                    />
                    </div>
                    <MainCardList tags={activeTags} searchQuery={searchString} bb={bb} sorting={sorting} mapCenter={mapCenter}/>
                </QueryBoundaries>
                <div id="helpUsBox">
                <a href="https://smartakartan.se/starta-verksamhet">
                    <img src='/hjälpaOss.jpg' />
                </a></div>
            </MainContainer></>
}
