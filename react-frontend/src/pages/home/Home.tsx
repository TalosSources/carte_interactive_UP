// React
import React, { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'

// Map
import 'leaflet/dist/leaflet.css'
import 'leaflet-gesture-handling/dist/leaflet-gesture-handling.css'
import L from 'leaflet'
import GestureHandling from 'leaflet-gesture-handling'
import { SMALL_SCREEN_WIDTH } from '../../lib/constants'
import { Region } from '../../lib/KesApi'
import { QueryBoundaries } from '../../lib/QueryBoundary'
import { SearchBox } from './SearchBox'
import { SKMapContainer } from './SKMapContainer'
import { MainCardList } from './MainCardList'
import { RegionContext } from '../../components/RegionContext'

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
    if (typeof regionSlugP !== 'undefined') {
      setRegionSlug(regionSlugP)
    }
  }, [regionSlugP])
  const region = regionList.find(r => r.properties.slug === regionSlugP)

  const [searchString, setSearchString] = useState<string>(params.get('s') ?? '')
  const [mapCenter, setMapCenter] = useState(L.latLng({ lat: 50, lng: 12 }))
  const [mapBounds, setMapBounds] = useState(L.latLngBounds([]))

  const sorting = Sorting.Distance.value

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

  return <RegionContext.Provider value={region}>
          <SKMapContainer setMapBounds={setMapBounds} setMapCenter={setMapCenter} searchQuery={searchString} bb={mapBounds} tags={[]}/>

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
                    <MainCardList tags={[]} searchQuery={searchString} bb={mapBounds} sorting={sorting} mapCenter={mapCenter}/>
                </QueryBoundaries>
                <div id="helpUsBox">
                <a href="https://smartakartan.se/starta-verksamhet">
                    <img src='/hjälpaOss.jpg' />
                </a></div>
            </MainContainer>
          </RegionContext.Provider>
}
