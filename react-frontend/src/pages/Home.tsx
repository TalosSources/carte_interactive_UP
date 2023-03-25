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
import SelectFromObject, { AlternativeMap } from "../components/SelectFromObject";
import GetInvolved from "../components/GetInvolved";
import HighlightInitiative from "../components/HighlightInitiative";

import useWindowSize from "../hooks/useWindowSize";

// Types
import { Tag, Initiative, Feature } from "../types/Initiative";
import { Region } from "../types/Region";

// Constants
import { MEDIUM_SCREEN_WIDTH, SMALL_SCREEN_WIDTH } from "../constants";


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

// Components
function RegionSelector(props: { value: string; handleSelectChange: React.ChangeEventHandler<HTMLSelectElement>; regionList: Region[]; }) {
    // Inspiration: https://reactjs.org/docs/forms.html#the-select-tag
    console.log(props.value);
    return (
        <select value={props.value} onChange={props.handleSelectChange}>
            {
                props.regionList.map(
                    (regionElement) => (
                        //<option key={regionElement.id} value={regionElement.id}>
                        <option key={regionElement.id} value={regionElement.properties.slug}>
                            {regionElement.properties.title}
                        </option>
                    )
                )
            }
        </select>
    );
}

export default function Home() {

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
    const [localizedInitiatives, setLocalizedInitiatives] = useState([]);
    const [globalInitiatives, setGlobalInitiatives] = useState<Initiative[]>([]);
    const [searchString, setSearchString] = useState(urlSearchString);
    const [activeRegionSlug, setActiveRegionSlug] = useState(regionSlug);
    // const [activeRegion, setActiveRegion] = useState({properties: { welcome_message_html: ""}});
    const [activeTags, setActiveTags] = useState<string[]>(urlActiveTags);
    const [regionList, setRegionList] = useState([]);
    const [mapCenter, setMapCenter] = useState(new GeoCoordinate({latitude: 50, longitude: 12}));
    const [mapBounds, setMapBounds] = useState(new GeoBoundingBox());
    const [sorting, setSorting] = useState(Sorting.Distance.value);
    const [initiativesToShow, setInitiativesToShow] = useState(WhatToShow.Everything.value);
    const [tags, setTags] = useState<Tag[]>([]);


    const windowSize = useWindowSize();

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
        const tag_api_url = `${process.env.REACT_APP_BACKEND_URL}/tags/`;
        fetch(tag_api_url)
        .then(response => response.json())
        .then(response_json => {
            console.log("tags", response_json);
            const tags = response_json.map((tag: Tag) => {
                let isActive = urlActiveTags.includes(tag.slug)
                tag.title = tag.title.replace("&amp;", "&")
                return {...tag, active: isActive}

                
            }) 
            setTags(tags);
            // remove invalid strings in activeTags
            // setActiveTags(tags.filter(tag => tag.active).map(tag => tag.slug));
        });
        // fetch initial initiatives
        const initiatives_api_url = `${process.env.REACT_APP_BACKEND_URL}/initiatives/`;
        fetch(initiatives_api_url)
            .then(response => response.json())
            .then(initiatives => {
                const [global, local] = initiatives
                    .reduce((result: Initiative[][], initiative: Initiative) => {
                        result[initiative.locations.features.length > 0 ? 1 : 0].push(initiative);
                        return result;
                    },
                    [[], []]);

                setLocalizedInitiatives(local);
                setGlobalInitiatives(global);
            })
            .catch(err => console.error(err));

        // Fetch regions
        const region_api_url = `${process.env.REACT_APP_BACKEND_URL}/regions/`;
        fetch(region_api_url)
            .then(r => r.json())
            .then(regions => {
                console.log("regionList", regions['features']);
                setRegionList(regions['features']);
                // setActiveRegion(regions['features'].find((region: Region) => region.properties.slug == activeRegionSlug))
            }
            )
            .catch(err => console.error(err));
    }, []);

    // refresh region
    const region_slug = activeRegionSlug;
    console.log("regionList", regionList);
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
        return activeTags.every((tagSlug: string) => initiative.tags.some(iTag => iTag.slug == tagSlug))

    }
    function initiativeMatchesSearch(initiative: Initiative, searchString: string) {
        const keywords = searchString.split(' ');
        return keywords
            .map(keyword => keyword.toLowerCase())
            .every(keyword =>
                initiative.initiative_title_texts.some(itt =>
                    itt['text'].toLowerCase().includes(keyword)
                ) ||
                initiative.tags.some(tag =>
                    tag.title.toLowerCase().includes(keyword)
                ) ||
                initiative.initiative_description_texts.some(idt =>
                    idt['text'].toLowerCase().includes(keyword)
                )
            );
    }
    function initiativeInsideMap(initiative: Initiative) {
        return initiative.locations.features.some(
            feature => mapBounds.contains(initiativeLocationFeatureToGeoCoordinate(feature))
        );
    }

    function initiativeLocationFeatureToGeoCoordinate(feature: Feature) {
        return new GeoCoordinate({'longitude': feature.geometry.coordinates[0], 'latitude': feature['geometry']['coordinates'][1]})
    }

    function sortInitiativesByName(initiatives : Initiative[]) {
        const names : [number, string][] = [];
        for (let i = 0; i < initiatives.length; i++) {
            names.push([i, initiatives[i].initiative_title_texts[0]['text']]);
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
    initiatives = initiatives
        .filter(initiativeMatchesCurrentSearch)
        .filter(initiativeMatchCurrentTags);

    // Prepare tags
    /*
    function sortTagsByTotalInitiatives(tag_a, tag_b) {
        return tag_b.initiatives.length - tag_a.initiatives.length
    }
    */
    function calculateTagEntropy(initiatives: Initiative[]) {
        const tag_count = initiatives.reduce((map, initiative) =>
            initiative.tags.reduce((map, tag) => {
                if (map.has(tag.id)) {
                    const n = map.get(tag.id);
                    map.set(tag.id, n+1);
                } else {
                    map.set(tag.id, 1);
                }
                return map;
            },
            map),
        new Map());
        return Object.fromEntries(tags.map((/** @type {Tag} */ tag: Tag) => {
            if (tag_count.has(tag.id)) {
                const tc = tag_count.get(tag.id); 
                return [tag.id, tc*(initiatives.length - tc)]
            } else {
                return [tag.id, 0]
            }
        }));
    }
    const tagEntropy = calculateTagEntropy(initiatives);
    function sortTagsByEntropy(tag_a: Tag, tag_b: Tag) {
        return tagEntropy[tag_b.id] - tagEntropy[tag_a.id]
    }

    const TOP_TAGS_LIMIT = 10;
    let top_tags = tags
        .filter((tag: Tag) => tagEntropy[tag.id] > 0)
    top_tags.sort(sortTagsByEntropy);
    top_tags = top_tags.slice(0, TOP_TAGS_LIMIT) // Limit top tags
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
                leafletToGeoCoordinate(newBounds['_southWest'])]
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

    function findRegionFromSlug (regionSlug: string) { 
        return regionList.filter((reg: Region) => reg.properties.slug === regionSlug)[0]

    }

    return (
        <>
        <NavBar
            handleRegionChange={handleRegionChange}
            activeRegionSlug={activeRegionSlug}
            regionList={regionList}
        />
            <Header>
                    {(() => {
                        let aRegion: Region = findRegionFromSlug(activeRegionSlug)
                        return (
                <div dangerouslySetInnerHTML={{__html: aRegion?.properties?.welcome_message_html}}>
                    </div>

                        )
                    })()
                    }
            </Header>
            {/*  
                 */}
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
                        onChange={event => setSearchString(event.target.value)}/>
                    <div className="form-check checkbox-lg ml-4">
                        <input className="form-check-input" type="checkbox" role="switch" id="flexSwitchCheckDefault" />
                        <label className="form-check-label text-white" htmlFor="flexSwitchCheckDefault"
                            style={{minWidth: "100px"}}
                        >Öppet nu</label>
                    </div>
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
{/* =======
        <div>
            <h2>Smartakartan</h2>
            <RegionSelector
                handleSelectChange={event => {
                    const new_region_slug = event.target.value;
                    setActiveRegionSlug(new_region_slug);
                }
                }
                value={activeRegionSlug}
                regionList={regionList}
            />
            <div dangerouslySetInnerHTML={{__html: activeRegion.properties.welcome_message_html}}></div>
            <MapContainer id="map" center={[57.70, 11.97]} zoom={13} scrollWheelZoom={false}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
>>>>>>> 112-typescript:react-frontend/src/pages/Home.tsx
                />
                </div> */}



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
                                    active={(() => {
                                        const isActive = activeTags.find((ts: string) => tagElement.slug == ts)
                                        return isActive ? true: false;
                                        })()
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
                        (clickedSlug) => {toggleActiveTag(clickedSlug)}, tagEntropy)}
                    </div>
                </LeftSide>
                <RightSide>

                    {windowSize?.width > SMALL_SCREEN_WIDTH && <div className="d-flex flex-row">
                        <OutlineButton onClick={() => {}}>Föreslå en verksamhet</OutlineButton>
                        <OutlineButton onClick={() => {}}>Bli volontär</OutlineButton>
                        <OutlineButton onClick={() => {}}>Starta en grej</OutlineButton>
                    </div>}
                    <MapContainer 
                        id="map" 
                        center={[57.70, 11.97]} 
                        zoom={10} 
                        scrollWheelZoom={false} 
                        // gestureHandling={true}
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
    function feature2Marker(initiative: Initiative, feature: Feature, index: number) {
        const title = initiative
            .initiative_title_texts[0]['text'];
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
