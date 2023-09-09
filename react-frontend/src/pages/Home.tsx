// React
import React, {useState, useEffect, startTransition} from "react";
import {Link, useNavigate, useParams, useSearchParams} from "react-router-dom";
import styled from "styled-components";
import { createBrowserHistory } from "@remix-run/router";

// Map
import {MapContainer, TileLayer, Marker, Popup, useMapEvent} from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import "leaflet-gesture-handling";
import "leaflet-gesture-handling/dist/leaflet-gesture-handling.css";
import L, { LeafletEvent } from "leaflet";
import GestureHandling from "leaflet-gesture-handling";
import MarkerClusterGroup from 'react-leaflet-cluster'

import { GeoCoordinate } from "../Coordinate";
import { GeoBoundingBox } from "../BoundingBox";


import {renderCardCollection} from "../Cards";
import TopTagButton from "../components/TopTagButton";
import SelectFromObject from "../components/SelectFromObject";

import { buildUrl } from 'build-url-ts';
import useWindowSize from "../hooks/useWindowSize";

import { useTranslation } from 'react-i18next';

// Constants
import { MEDIUM_SCREEN_WIDTH, SMALL_SCREEN_WIDTH } from "../constants";
import { Feature, fetchTags, Initiative, initiativeLocationFeatureToGeoCoordinate, matchTagsWithInitiatives, Region, Tag, useFilteredInitiatives, useInitiatives } from "../KesApi";
import { Button } from "react-bootstrap";
import { QueryBoundaries } from "../QueryBoundary";
import { useMatomo } from "@datapunt/matomo-tracker-react";


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
const SearchRow = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 0.5rem;
    width: 100vw;
`

const TagContainer = styled.div`
    overflow-x: scroll;

`;

const Sorting = {
  Alphabetical: { value: "1", text: "ui.sortAlpha"},
  Distance: { value: "2", text: "ui.sortByDist" }
};

const WhatToShow = {
    Everything: {value: "1", text:"ui.allInitiatives" },
    OnlyOnMap: {value: "2", text:"ui.onlyOnTheMap"},
    WithoutGlobal: {value: "3", text:"ui.hideGlobal"}
}

class EnabledGestureHandling extends GestureHandling {
    constructor(arg: L.Map) {
        super(arg)
        this.enable()
    }
}

L.Map.addInitHook("addHandler", "gestureHandling", EnabledGestureHandling);
L.Icon.Default.imagePath="/"

export default function Home(
    {regionList, setRegionSlug, regionSlug}:{regionList: Region[], setRegionSlug: any, regionSlug: string}) {

    const [queryParameters] = useSearchParams()
    const {regionSlugP} = useParams();
    const { trackPageView, trackEvent } = useMatomo()

    // Track page view
    React.useEffect(() => {
        console.log("track view")
        trackPageView({
            documentTitle: 'Page title', // optional
            href: 'https://LINK.TO.PAGE', // optional
            customDimensions: [
                {
                id: 1,
                value: 'loggedIn',
                },
            ], // optional
        })
    }, [])
    useEffect(() =>{
        if (typeof regionSlugP !== 'undefined') {
            setRegionSlug(regionSlugP)
        }
    }, [regionSlugP])
    let urlSearchString;
    if (queryParameters.has("s")) {
        urlSearchString = queryParameters.get("s");
        if (urlSearchString == null) {
            urlSearchString = "";
        }
    } else {
        urlSearchString = "";
    }
    let urlActiveTags: string[];
    const activeTagsPart = queryParameters.get("t")
    if (!(activeTagsPart==null) && !(activeTagsPart=="")) {
        urlActiveTags = activeTagsPart.split(","); 
    } else {
        urlActiveTags = [];
    }
    const [searchString, setSearchString] = useState(urlSearchString);
    // const [activeRegion, setActiveRegion] = useState({properties: { welcome_message_html: ""}});
    const [activeTags, setActiveTags] = useState<string[]>(urlActiveTags);
    const [mapCenter, setMapCenter] = useState(new GeoCoordinate({latitude: 50, longitude: 12}));
    const [mapBounds, setMapBounds] = useState(new GeoBoundingBox());
    const [sorting, setSorting] = useState(Sorting.Distance.value);
    const [initiativesToShow, setInitiativesToShow] = useState(WhatToShow.Everything.value);
    const [tags, setTags] = useState<Tag[]>([]);

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [regionSlug]);

    useEffect(() => {
        const history = createBrowserHistory();
        const queryParams: {[param: string]: string | string[]} = {}
        if (searchString !== "") {
            queryParams.s = searchString
        }
        if (activeTags.length > 0) {
            queryParams.t = activeTags
        }
        const newUrl = buildUrl({path:'/r/' + regionSlug,
                  queryParams: queryParams})
        history.replace(newUrl);
    }, [activeTags, searchString, regionSlugP, regionSlug]);

    
    useEffect(() => {
        // fetch tags
        fetchTags()
        .then(response_json => {
            const tags = response_json.map((tag: Tag) => {
                tag.title = tag.title.replace("&amp;", "&")
                return tag
            }) 
            setTags(tags);
            // remove invalid strings in activeTags
        });
    }, []);

    // refresh region
    const region = regionList.filter((r: Region) => r['properties']['slug'] === regionSlug);
    let activeReg;
    if (region.length == 0) {
        activeReg = { properties:{
            welcome_message_html: ""
        }
        };
    } else {
        activeReg = region[0];
    }

    let bb: GeoBoundingBox | "Show all" | "Hide global" = mapBounds;
    if (initiativesToShow === WhatToShow.Everything.value) {
        bb = "Show all"
    } else if (initiativesToShow === WhatToShow.WithoutGlobal.value) {
        bb = "Hide global"
    }

    return <QueryBoundaries>
            <SKMapContainer setMapBounds={setMapBounds} setMapCenter={setMapCenter} searchQuery={searchString} bb={bb} tags={activeTags}/>

            <Header>
                {(() => (
                    <div id="welcomeMessage" dangerouslySetInnerHTML={{__html: activeReg.properties.welcome_message_html}} />
                ))()}
            </Header>

            <MainContainer>
                <SearchBox setQuery={setSearchString} initialSearch={urlSearchString}/>

                <TagBar tags={tags} urlActiveTags={urlActiveTags} setHomeTags={setActiveTags} searchQuery={searchString} bb={bb}/>

                <div id="filters">
                    <SelectFromObject 
                        obj={WhatToShow}
                        defaultValue={WhatToShow.Everything.value}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setInitiativesToShow(e.target.value)} 
                    />
                    <SelectFromObject 
                        obj={Sorting}
                        defaultValue={Sorting.Distance.value}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSorting(e.target.value)}
                    />
                </div>
                <MainCardList tags={activeTags} searchQuery={searchString} bb={bb} sorting={sorting} mapCenter={mapCenter}/>
                <div id="helpUsBox">
                <a href="https://smartakartan.se/starta-verksamhet">
                    <img src='/hjälpaOss.jpg' />
                </a></div>
            </MainContainer>
        </QueryBoundaries>
}

// Home Components

function MainCardList({tags, searchQuery, bb, sorting, mapCenter}: {tags: string[], searchQuery: string, bb: GeoBoundingBox | "Hide global" | "Show all", sorting: string, mapCenter: GeoCoordinate}) {
    function sortInitiativesByName(initiatives: Initiative[]) {
        const names: [number, string][] = [];
        for (let i = 0; i < initiatives.length; i++) {
            names.push([i, t('initiatives.' + initiatives[i].slug + '.title')]);
        }

        names.sort((left, right) => left[1] < right[1] ? - 1 : 1);
        
        const sortedInitiatives = [];
        
        for (let i = 0; i < initiatives.length; i++) {
            sortedInitiatives.push(initiatives[names[i][0]]);
        }
        
        return sortedInitiatives;
    }

    function sortInitiativesByDistanceToCenter(initiatives: Initiative[]) {
        function initiativeDistanceFromMapCenter(initiative: Initiative) {
            if (initiative.locations.features.length === 0) {
                return 0;
            }
            return Math.min(...initiative.locations.features.map(
                feature => mapCenter.quickDistanceTo(initiativeLocationFeatureToGeoCoordinate(feature))
            ))
        }

        const distances = [];

        for (let i = 0; i < initiatives.length; i++) {
            distances.push([i, initiativeDistanceFromMapCenter(initiatives[i])]);
        }
        
        distances.sort((left, right) => left[1] < right[1] ? -1 : 1);

        const sortedInitiatives = [];
        
        for (let i = 0; i < initiatives.length; i++) {
            sortedInitiatives.push(initiatives[distances[i][0]]);
        }
        
        return sortedInitiatives;
    }
    const {t} = useTranslation();

    const [numberOfCards, setNumberOfCards] = useState<number>(16)

    let initiatives = useFilteredInitiatives(tags, searchQuery, bb)
    if (sorting === Sorting.Distance.value) {
        initiatives = sortInitiativesByDistanceToCenter(initiatives);
    } else if (sorting === Sorting.Alphabetical.value) {
        initiatives = sortInitiativesByName(initiatives);
    }
    const renderedCards = renderCardCollection(initiatives.slice(0, numberOfCards));

    return (
        <>
            <div id="cards-canvas">{renderedCards}</div>
            {(initiatives.length > numberOfCards) &&
                <div id="centerContainer">
                    <Button
                        id="loadMoreCardsButton"
                        onClick={() => setNumberOfCards(numberOfCards + 16)}>
                        {t('ui.loadMoreCards')}
                    </Button>
                </div>}
        </>
    );

}

function TagBar({tags, urlActiveTags, setHomeTags, searchQuery, bb}: {tags:Tag[], urlActiveTags: string[], setHomeTags: (tags: string[])=>void, searchQuery: string, bb: GeoBoundingBox | "Show all" | "Hide global"}) {
    function calculateTagEntropy(initiatives: Initiative[]) {
        const tag_count = initiatives.reduce((map, initiative) =>
            initiative.tags.reduce((map, tag) => {
                const n = map.get(tag)
                if (typeof n !== 'undefined') {
                    map.set(tag, n+1);
                } else {
                    map.set(tag, 1);
                }
                return map;
            },
            map),
            new Map<string, number>());
        return Object.fromEntries(tags.map((tag: Tag) => {
            const tc = tag_count.get(tag.slug); 
            if (typeof tc !== 'undefined') {
                return [tag.slug, tc*(initiatives.length - tc)]
            } else {
                return [tag.slug, 0]
            }
        }));
    }
    function sortTagsByEntropy(tag_a: Tag, tag_b: Tag) {
        return tagEntropy[tag_b.slug] - tagEntropy[tag_a.slug]
    }
    function toggleActiveTag(tagSlug: string) {
        if (barActiveTags.find((ts: string) => tagSlug == ts)) {
            const newTagList = barActiveTags.filter((ts: string) => ts !== tagSlug)
            setBarTags(newTagList);
        } else {
            setBarTags([...barActiveTags, tagSlug]);
        }
    } 

    const [barActiveTags, setBarTags] = useState<string[]>(urlActiveTags);
    useEffect(() => {
        startTransition(() => {
            setHomeTags(barActiveTags);
        })
    }, [barActiveTags])

    const initiatives = useFilteredInitiatives(barActiveTags, searchQuery, bb);
    const tagEntropy = calculateTagEntropy(initiatives);

    const TOP_TAGS_LIMIT = 6;
    let top_available_tags = tags
        .filter((tag: Tag) => tagEntropy[tag.slug] > 0)
    top_available_tags.sort(sortTagsByEntropy);
    top_available_tags = top_available_tags.slice(0, TOP_TAGS_LIMIT) // Limit top tags

    return <TagContainer className="d-flex flex-row mb-2 mt-3 overflowX-scroll">
                {
                    barActiveTags.map((tagSlug) => <TopTagButton
                            key={tagSlug}
                            title={tags.find(tag => tag.slug === tagSlug)?.title || ""}
                            onClick={() => toggleActiveTag(tagSlug)}
                            active={true}
                        />
                    )
                }
                {
                    top_available_tags.map((tagElement: Tag) => 
                        <TopTagButton
                            key={tagElement.title}
                            title={tagElement.title}
                            onClick={() => toggleActiveTag(tagElement.slug)}
                            active={(() => 
                                barActiveTags.some((ts: string) => tagElement.slug == ts)
                                )()
                            }
                            />
                    )
                }

            </TagContainer>
              

}
function MapMarker({initiative, feature, index}:{initiative: Initiative, feature: Feature, index: number}) {
    const {t} = useTranslation();
    const title = t('initiatives.'+initiative.slug+'.title')
    const icon: L.Icon<L.Icon.DefaultIconOptions> = new L.Icon.Default({iconUrl:'/marker-icon.png'})
    return <Marker 
            key={`m_${initiative.id}_${index}`}
            position={[feature['geometry']['coordinates'][1], feature['geometry']['coordinates'][0]]}
            title={title}
            icon={icon}
            >
            <Popup>
                <Link to={'/details/' + initiative.slug}>{title}</Link>
            </Popup>
        </Marker>;
}

function MapMarkers({initiatives}:{initiatives: Initiative[]}) {
    return <>
        { initiatives.map((initiative) =>
            initiative.locations.features.map((feature, index) =>
                <MapMarker key={`${initiative.id}_${index}`} initiative={initiative} feature={feature} index={index}/>
            )
        ).flat(1) }
    </>;
}

function SKMapContainer({setMapCenter, setMapBounds, tags, searchQuery, bb}:{setMapCenter: (newCenter: GeoCoordinate) => void, setMapBounds: (newBounds: GeoBoundingBox) => void, tags:string[], searchQuery: string, bb:GeoBoundingBox | "Hide global" | "Show all"}) {

    function leafletToGeoCoordinate(leafletCoordinate: { lng:number; lat:number; }) {
        return new GeoCoordinate({'longitude': leafletCoordinate['lng'], 'latitude': leafletCoordinate['lat']});
    }

    function RegisterMapCenter() {
        const _map = useMapEvent('moveend', (e: LeafletEvent) => {
            setMapCenter(leafletToGeoCoordinate(e.target.getCenter()));

            const newBounds = e.target.getBounds();
            setMapBounds(GeoBoundingBox.fromCoordinates([
                leafletToGeoCoordinate(newBounds['_northEast']),
                leafletToGeoCoordinate(newBounds['_southWest'])
            ]
            ));
        })
        return null;
    }
    const initiatives = useFilteredInitiatives(tags, searchQuery, bb);
    return <MapContainer 
            id="map" 
            center={[59, 15]} 
            zoom={6} 
            scrollWheelZoom={false} 
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
            <RegisterMapCenter/>
            <MarkerClusterGroup chunkedLoading>
                <MapMarkers initiatives={initiatives}/>
            </MarkerClusterGroup>
        </MapContainer>

}

function SearchBox({setQuery, initialSearch}: {setQuery: (query: string) => void, initialSearch: string}) {
    const {t} = useTranslation();

    const [searchString, setSearchString] = useState(initialSearch);

    useEffect(() => {
        startTransition(() => {
            setQuery(searchString);
        })
    },[searchString])

    let searchPlaceholder = t('ui.searchPlaceholder')
    if (typeof searchPlaceholder === 'undefined') {
        searchPlaceholder = 'Search something'
    }

    return <div>
            <SearchRow className="d-flex flex-row w-100"> 
                <input
                    className="form-control" 
                    name="search" 
                    placeholder={searchPlaceholder}
                    value={searchString}
                    onChange={event => setSearchString(event.target.value)}/>
            </SearchRow>
        </div>
}