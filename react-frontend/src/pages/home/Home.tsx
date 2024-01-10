// React
import React, { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'

// Map
import 'leaflet/dist/leaflet.css'
import 'leaflet-gesture-handling/dist/leaflet-gesture-handling.css'
import L from 'leaflet'
import GestureHandling from 'leaflet-gesture-handling'
import { GeoCoordinate } from '../../lib/Coordinate'
import { GeoBoundingBox } from '../../lib/BoundingBox'
import SelectFromObject from './SelectFromObject'

// Constants
import { SMALL_SCREEN_WIDTH } from '../../lib/constants'
import { fetchTags, Region, type Tag } from '../../lib/KesApi'
import { QueryBoundaries } from '../../lib/QueryBoundary'
import { TagBar } from './TagBar'
import { SearchBox } from './SearchBox'
import { SKMapContainer } from './SKMapContainer'
import { MainCardList } from './MainCardList'
import { RegionContext } from '../../components/RegionContext'
import { then } from '../../components/NullableMonad'

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
  { setRegionSlug, regionList }: { setRegionSlug: (slug: string) => void, regionList: Region[] }): React.JSX.Element {
  const { regionSlugP } = useParams()
  const [params, setParams] = useSearchParams()

  useEffect(() => {
    then(regionSlugP, setRegionSlug)
  }, [regionSlugP])
  const region = regionList.find(r => r.properties.slug === regionSlugP)

  const [searchString, setSearchString] = useState<string>(params.get('s') ?? '')
  const [activeTags, setActiveTags] = useState<string[]>(params.get('activeTags')?.split(',') ?? [])
  const [mapCenter, setMapCenter] = useState(new GeoCoordinate({ latitude: 50, longitude: 12 }))
  const [mapBounds, setMapBounds] = useState(new GeoBoundingBox())
  const [sorting, setSorting] = useState(Sorting.Distance.value)
  const [initiativesToShow, setInitiativesToShow] = useState(WhatToShow.Everything.value)
  const [tags, setTags] = useState<Tag[]>([])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [region])

  useEffect(() => {
    setParams((prev) => {
      if (searchString !== null && searchString !== '') {
        prev.set('s', searchString)
      } else {
        prev.delete('s')
      }
      return prev
    })
  }, [searchString])
  useEffect(() => {
    setParams((prev) => {
      if (activeTags.length > 0) {
        prev.set('activeTags', activeTags.join(','))
      } else {
        prev.delete('activeTags')
      }
      return prev
    })
  }, [activeTags])

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

  let bb: GeoBoundingBox | 'Show all' | 'Hide global' = mapBounds
  if (initiativesToShow === WhatToShow.Everything.value) {
    bb = 'Show all'
  } else if (initiativesToShow === WhatToShow.WithoutGlobal.value) {
    bb = 'Hide global'
  }

  return <RegionContext.Provider value={region}>
          <SKMapContainer setMapBounds={setMapBounds} setMapCenter={setMapCenter} searchQuery={searchString} bb={bb} tags={activeTags}/>

            <Suspense fallback={<></>}>
            <Header>
                {(() => (
                    <div id="welcomeMessage" dangerouslySetInnerHTML={{ __html: region?.properties.welcome_message_html ?? '' }} />
                ))()}
            </Header>
            </Suspense>

            <MainContainer>
                <SearchBox setQuery={setSearchString} initialSearch={searchString}/>
                <QueryBoundaries>
                    <TagBar tags={tags} urlActiveTags={activeTags} setHomeTags={setActiveTags} searchQuery={searchString} bb={bb}/>

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
            </MainContainer>
          </RegionContext.Provider>
}
