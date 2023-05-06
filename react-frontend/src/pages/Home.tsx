import React, {useState, useEffect} from "react";
import { buildUrl } from 'build-url-ts';
import {MapContainer, TileLayer, Marker, Popup, useMapEvent} from 'react-leaflet';
import {useNavigate, useParams, useSearchParams} from "react-router-dom";
// import { GeoCoordinate, BoundingBox } from "geocoordinate";
import styled from "styled-components";
// import {useParams, useSearchParams} from "react-router-dom";
import { GeoCoordinate } from "../Coordinate";
import { GeoBoundingBox } from "../BoundingBox";


import "leaflet/dist/leaflet.css";
import "leaflet-gesture-handling";
import "leaflet-gesture-handling/dist/leaflet-gesture-handling.css";
import L, { LeafletEvent } from "leaflet";
import {renderCardCollection} from "../Cards";
import GestureHandling from "leaflet-gesture-handling";
import { createBrowserHistory } from "@remix-run/router";

import NavBar from "../components/NavBar";
import FloatingTop from "../components/FloatingTop";
import TopTagButton from "../components/TopTagButton";
import OutlineButton from "../components/OutlineButton";
import RegionSelectorDropdown from "../components/RegionSelectorDropdown";
import SelectFromObject from "../components/SelectFromObject";
import GetInvolved from "../components/GetInvolved";
import HighlightInitiative from "../components/HighlightInitiative";

import useWindowSize from "../hooks/useWindowSize";

import { useTranslation } from 'react-i18next';
import '../i18n';

// Constants
import { MEDIUM_SCREEN_WIDTH, SMALL_SCREEN_WIDTH } from "../constants";
import { Feature, fetchInitiatives, fetchLanguages, fetchRegions, fetchTags, Initiative, initiativeLocationFeatureToGeoCoordinate, Language, matchTagsWithInitiatives, Region, Tag } from "../KesApi";
import { registerInitiativeTranslations } from "../i18n";


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
    background-color: indigo;
    padding: 2rem;
    padding-top: 50px;
    border-radius: 20px;
    display: flex: 
    flex-directon: column;
    margin-left: 2rem;
    margin-right: 2rem;
    @media (max-width: ${SMALL_SCREEN_WIDTH}px) {
        margin-left: 0;
        margin-right: 0;
        padding: 1rem;
        margin-top: 2rem;
    }

    `
const Sides = styled.div`
    display: flex;
    flex-direction: row;
    @media (max-width: ${SMALL_SCREEN_WIDTH}px) {
        flex-direction: column;
    }
`

const LeftSide = styled.div`
    flex: 1;
    max-height: 100vh;
    @media (max-width: ${SMALL_SCREEN_WIDTH}px) {
        order: 2;
        width: 100%;
        height: 100vh;
        overflow-y: scroll;
    }
`
const RightSide = styled.div`
    flex: 1;
    @media( max-width: 800px) {
        order: 1;
        width: 100%;
        height: 30vh;
        margin-bottom: 1rem;
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
  Alphabetical: { value: "1", text: "Sort alphabetically"},
  Distance: { value: "2", text: "Sort by distance" }
};

const WhatToShow = {
    Everything: {value: "1", text:"Show all" },
    OnlyOnMap: {value: "2", text:"Only show initiatives on the map"},
    WithoutGlobal: {value: "3", text:"Hide global initiatives"}
}

class EnabledGestureHandling extends GestureHandling {
    constructor(arg: L.Map) {
        super(arg)
        this.enable()
    }
}
L.Map.addInitHook("addHandler", "gestureHandling", EnabledGestureHandling);

export default function Home() {
    const homeStart = performance.now()

    const navigate = useNavigate();

    let {regionSlug} = useParams();
    const [queryParameters] = useSearchParams()
    if (typeof regionSlug == 'undefined') {
        regionSlug = 'global';
    }
    let urlSearchString;
    if (queryParameters.has("s")) {
        urlSearchString = queryParameters.get("s");
        if (urlSearchString == null) {
            urlSearchString = "";
        }
    } else {
        urlSearchString = "";
    }
    let urlActiveTags : string[];
    const activeTagsPart = queryParameters.get("t")
    if (!(activeTagsPart==null) && !(activeTagsPart=="")) {
        urlActiveTags = activeTagsPart.split(","); 
    } else {
        urlActiveTags = [];
    }
    //console.log("UrlActiveTags")
    //console.log(urlActiveTags)
    console.log(regionSlug);
    const [localizedInitiatives, setLocalizedInitiatives] = useState<Initiative[]>([]);
    const [globalInitiatives, setGlobalInitiatives] = useState<Initiative[]>([]);
    const [searchString, setSearchString] = useState(urlSearchString);
    const [activeRegionSlug, setActiveRegionSlug] = useState(regionSlug);
    // const [activeRegion, setActiveRegion] = useState({properties: { welcome_message_html: ""}});
    const [activeTags, setActiveTags] = useState<string[]>(urlActiveTags);
    const [regionList, setRegionList] = useState<Region[]>([]);
    const [mapCenter, setMapCenter] = useState(new GeoCoordinate({latitude: 50, longitude: 12}));
    const [mapBounds, setMapBounds] = useState(new GeoBoundingBox());
    const [sorting, setSorting] = useState(Sorting.Distance.value);
    const [initiativesToShow, setInitiativesToShow] = useState(WhatToShow.Everything.value);
    const [tags, setTags] = useState<Tag[]>([]);
    const [tagsByInitiatives, setTagsByInitiatives] = useState<Map<string, Tag[]>>(new Map());
    const [languages, setLanguages] = useState<Language[]>([]);


    const windowSize = useWindowSize();
    useEffect(() => {
        const localizedIMap = matchTagsWithInitiatives(localizedInitiatives, tags);
        const globalizedIMap = matchTagsWithInitiatives(globalInitiatives, tags);
        setTagsByInitiatives(new Map([...localizedIMap, ...globalizedIMap]));
    }, [tags, localizedInitiatives, globalInitiatives]);

    useEffect(() => {
        //navigate('/r/' + activeRegionSlug);
        const history = createBrowserHistory();
        const queryParams : {[param:string] : string | string[]} = {}
        if (searchString !== "") {
            queryParams.s = searchString
        }
        if (activeTags.length > 0) {
            queryParams.t = activeTags
        }
        const newUrl = buildUrl({path:'/r/' + activeRegionSlug,
                  queryParams: queryParams})
        history.replace(newUrl);
    }, [activeRegionSlug, activeTags, searchString]);

    
    useEffect(() => {
        // fetch tags
        fetchTags()
        .then(response_json => {
            console.log("tags", response_json);
            const tags = response_json.map((tag: Tag) => {
                tag.title = tag.title.replace("&amp;", "&")
                return tag
            }) 
            setTags(tags);
            // remove invalid strings in activeTags
        });
        // fetch initial initiatives
        fetchInitiatives()
            .then(initiatives => {
                const [global, local] = initiatives
                    .reduce((result: Initiative[][], initiative: Initiative) => {
                        result[initiative.locations.features.length > 0 ? 1 : 0].push(initiative);
                        return result;
                    },
                    [[], []]);

                setLocalizedInitiatives(local);
                setGlobalInitiatives(global);
                for (const i of initiatives) {
                    registerInitiativeTranslations(i);
                }
            })
            .catch(err => console.error(err));

        // Fetch regions
        fetchRegions()
            .then(regions => {
                console.log("regionList", regions);
                setRegionList(regions);
            }
            )
            .catch(err => console.error(err));
        
        fetchLanguages().then(l => setLanguages(l));
    }, []);

    const {t} = useTranslation();

    // refresh region
    const region_slug = activeRegionSlug;
    const region = regionList.filter((r: Region) => r['properties']['slug'] === region_slug);
    let activeReg;
    if (region.length == 0) {
        activeReg = { properties:{
            welcome_message_html: ""
        }
        };
    } else {
        activeReg = region[0];
    }

    // refresh cards

    function initiativeMatchesCurrentSearch(initiative: Initiative) {
        return initiativeMatchesSearch(initiative, searchString)
    }

    function initiativeMatchCurrentTags(initiative: Initiative) {
        return activeTags.every((tagSlug: string) => initiative.tags.some(iTag => iTag == tagSlug))

    }
    function initiativeMatchesSearch(initiative: Initiative, searchString: string) {
        const keywords = searchString.split(' ');
        return keywords
            .map(keyword => keyword.toLowerCase())
            .every(keyword =>
                Object.entries(initiative.initiative_translations).some(([langCode, trans], i) =>
                    trans['title'].toLowerCase().includes(keyword)
                ) ||
                tagsByInitiatives.get(initiative.slug)?.some(tag =>
                    tag.title.toLowerCase().includes(keyword)
                ) ||
                Object.entries(initiative.initiative_translations).some(([langCode, trans], i) =>
                    trans['short_description'].toLowerCase().includes(keyword)
                ) ||
                Object.entries(initiative.initiative_translations).some(([langCode, trans], i) =>
                    trans['description'].toLowerCase().includes(keyword)
                ) ||
                false
            );
    }
    function initiativeInsideMap(initiative: Initiative) {
        return initiative.locations.features.some(
            feature => mapBounds.contains(initiativeLocationFeatureToGeoCoordinate(feature))
        );
    }

    function sortInitiativesByName(initiatives : Initiative[]) {
        const names : [number, string][] = [];
        for (let i = 0; i < initiatives.length; i++) {
            names.push([i, t('initiatives.'+initiatives[i].slug+'.title')]);
        }
        names.sort(function(left, right) {
            return left[1] < right[1] ? -1 : 1;
        });
        const sortedInitiatives = [];
        for (let i = 0; i < initiatives.length; i++) {
            sortedInitiatives.push(initiatives[names[i][0]]);
        }
        return sortedInitiatives;
    }

    function sortInitiativesByDistanceToCenter(initiatives: Initiative[]) {
        function initiativeDistanceFromMapCenter(initiative: Initiative) {
            return Math.min(...initiative.locations.features.map(
                feature => mapCenter.quickDistanceTo(initiativeLocationFeatureToGeoCoordinate(feature))
            ))
        }

        const distances = [];
        for (let i = 0; i < initiatives.length; i++) {
            distances.push([i, initiativeDistanceFromMapCenter(initiatives[i])]);
        }
        distances.sort(function(left, right) {
            return left[1] < right[1] ? -1 : 1;
        });
        const sortedInitiatives = [];
        for (let i = 0; i < initiatives.length; i++) {
            sortedInitiatives.push(initiatives[distances[i][0]]);
        }
        return sortedInitiatives;
    }

    const preInitiatives = performance.now()
    let initiatives: Initiative[] = localizedInitiatives;
    if (initiativesToShow === WhatToShow.OnlyOnMap.value) {
        initiatives = initiatives.filter(initiativeInsideMap);
    }
    if (sorting === Sorting.Distance.value) {
        initiatives = sortInitiativesByDistanceToCenter(initiatives);
    }
    if (initiativesToShow === WhatToShow.Everything.value) {
        initiatives = globalInitiatives.concat(initiatives);
    }
    if (sorting === Sorting.Alphabetical.value) {
        initiatives = sortInitiativesByName(initiatives);
    }
    const preSearch = performance.now()
    initiatives = initiatives
        .filter(initiativeMatchesCurrentSearch)
        .filter(initiativeMatchCurrentTags);
    const postInitiatives = performance.now()

    // Prepare tags
    /*
    function sortTagsByTotalInitiatives(tag_a, tag_b) {
        return tag_b.initiatives.length - tag_a.initiatives.length
    }
    */
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
    const preTags = performance.now()
    const tagEntropy = calculateTagEntropy(initiatives);
    const postEntropy = performance.now()
    function sortTagsByEntropy(tag_a: Tag, tag_b: Tag) {
        return tagEntropy[tag_b.slug] - tagEntropy[tag_a.slug]
    }

    const TOP_TAGS_LIMIT = 10;
    let top_tags = tags
        .filter((tag: Tag) => tagEntropy[tag.slug] > 0)
    top_tags.sort(sortTagsByEntropy);
    const postSort = performance.now()
    // top_tags = top_tags.slice(0, TOP_TAGS_LIMIT) // Limit top tags
    console.log("top_tags", top_tags)

    //markers
    const mapMarkers = renderMapMarkers(initiatives);

    function leafletToGeoCoordinate(leafletCoordinate: { lng:number; lat:number; }) {
        return new GeoCoordinate({'longitude' : leafletCoordinate['lng'], 'latitude': leafletCoordinate['lat']});
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

    const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const new_region_slug: string = e.target.value;
        navigate('/r/' + new_region_slug);
        setActiveRegionSlug(new_region_slug);
    }

    const toggleActiveTag = (tagSlug: string) => {
        console.log(tagSlug)
        if (activeTags.find((ts: string) => tagSlug == ts)) {
            console.log("Remove from activeTags:", tagSlug)
            const newTagList = activeTags.filter((ts: string) => ts !== tagSlug)
            setActiveTags(newTagList);
        } else {
            console.log("Add to activeTags:", tagSlug)
            setActiveTags([...activeTags, tagSlug]);
        }
    } 

    const homeEnd = performance.now()
    console.log(`### Home-Timings ###`)
    console.log(`Start:               ${preInitiatives-homeStart}ms`)
    console.log(`Initiatives prepare: ${preSearch-homeStart}ms`)
    console.log(`Initiative searched: ${postInitiatives-homeStart}ms`)
    console.log(`Initiatives done:    ${preTags-homeStart}ms`)
    console.log(`Tag entropy calculat:${postEntropy-homeStart}ms`)
    console.log(`Tags sorted:         ${postSort-homeStart}ms`)
    console.log(`———————————————————————————————————————————`)
    console.log(`Total:               ${homeEnd-homeStart}ms`)

    return (
        <>
            <NavBar
                handleRegionChange={handleRegionChange}
                activeRegionSlug={activeRegionSlug}
                regionList={regionList}
                languages={languages}
            />
            <Header>
                    {(() => {
                        return (
                            <div dangerouslySetInnerHTML={{__html: activeReg.properties.welcome_message_html}} />
                        )
                    })()
                    }
            </Header>
            {windowSize.width > SMALL_SCREEN_WIDTH && <FloatingTop>
                <HighlightInitiative />
                { windowSize.width > MEDIUM_SCREEN_WIDTH ? <GetInvolved /> : <></>}
            </FloatingTop>}

            <MainContainer>
                <div>

                <SearchRow className="d-flex flex-row w-100"
                > 
                    
                    <RegionSelectorDropdown 
                        regionList={regionList}
                        activeRegionSlug={activeRegionSlug}
                        setActiveRegionSlug={setActiveRegionSlug}
                    ></RegionSelectorDropdown>

                    <input
                        className="form-control" 
                        name="search" 
                        value={searchString}
                        onChange={event => setSearchString(event.target.value)}/>
                </SearchRow>
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

                <TagContainer className="d-flex flex-row mb-2 mt-3 overflowX-scroll">
                    {
                        activeTags.map((tagSlug) => {
                            return (<TopTagButton
                                key={tagSlug}
                                title={tags.find(tag => tag.slug === tagSlug)?.title || ""}
                                onClick={() => toggleActiveTag(tagSlug)}
                                active={true}
                            />)
                        })
                    }
                    {
                        top_tags.map((tagElement: Tag) => (
                            <TopTagButton
                                key={tagElement.title}
                                title={tagElement.title}
                                onClick={() => toggleActiveTag(tagElement.slug)}
                                active={(() => 
                                    activeTags.some((ts: string) => tagElement.slug == ts)
                                    )()
                                }
                                />
                        ))
                    }

                </TagContainer>
              

                {/* This should be its own component, probably */}
                <Sides>

                    <LeftSide>
                        <div id="cards-canvas">
                        {renderCardCollection(
                            initiatives,
                            tagsByInitiatives,
                            (clickedSlug) => {toggleActiveTag(clickedSlug)}, tagEntropy)}
                        </div>
                    </LeftSide>
                    <RightSide>

                        {windowSize?.width > SMALL_SCREEN_WIDTH && <div className="d-flex flex-row">
                            <OutlineButton onClick={() => console.log("Proposing new feature not implemented.")}>{t('ui.proposeInitiative')}</OutlineButton>
                            <OutlineButton onClick={() => console.log("Becoming a volunteer not implemented.")}>{t('ui.becomeVolunteer')}</OutlineButton>
                            <OutlineButton onClick={() => console.log("Starting something not implemented.")}>{t('ui.startAThing')}</OutlineButton>
                        </div>}
                        <MapContainer 
                            id="map" 
                            center={[57.70, 11.97]} 
                            zoom={10} 
                            scrollWheelZoom={false} 
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                            {mapMarkers}
                            <RegisterMapCenter/>
                        </MapContainer>
                    </RightSide>
                </Sides>
            </MainContainer>
        </>
    );
}

// Helpers

function renderMapMarkers(initiatives: Initiative[]) {
    const {t} = useTranslation();
    function feature2Marker(initiative: Initiative, feature: Feature, index: number) {
        const title = t('initiatives.'+initiative.slug+'.title')
        L.Icon.Default.imagePath="/"
        return (
            <Marker 
                key={`m_${initiative.id}_${index}`}
                position={[feature['geometry']['coordinates'][1], feature['geometry']['coordinates'][0]]}>
                <Popup>
                    <a href={'/details/' + initiative.id}>{title}</a>
                </Popup>
            </Marker>
        );
    }

    return initiatives.map((initiative) =>
        initiative.locations.features.map((feature, index) => feature2Marker(initiative, feature, index))
    ).flat(1);
}
