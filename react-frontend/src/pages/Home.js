// @ts-check

import React, {useState, useEffect} from "react";
import {MapContainer, TileLayer, Marker, Popup, useMapEvent} from 'react-leaflet';
import {useNavigate, useParams, useSearchParams} from "react-router-dom";
import { GeoCoordinate, BoundingBox } from "geocoordinate";
import styled from "styled-components";


import "leaflet/dist/leaflet.css";
import "leaflet-gesture-handling";
import "leaflet-gesture-handling/dist/leaflet-gesture-handling.css";
import NavBar from "../components/NavBar";
import FloatingTop from "../components/FloatingTop";
import TopTagButton from "../components/TopTagButton";
import OutlineButton from "../components/OutlineButton";
import RegionSelectorDropdown from "../components/RegionSelectorDropdown";
import SelectFromObject from "../components/SelectFromObject";
import GetInvolved from "../components/GetInvolved";
import HighlightInitiative from "../components/HighlightInitiative";

import {renderCardCollection} from "../Cards";
import { createBrowserHistory } from "@remix-run/router";



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
    padding-top: 50px;
    border-radius: 20px;
    display: flex: 
    flex-directon: column;
    margin-left: 2rem;
    margin-right: 2rem;

    `
const Sides = styled.div`
    display: flex;
    flex-direction: row;
`

const LeftSide = styled.div`
    flex: 1;
    max-height: 100vh;
`
const RightSide = styled.div`
    flex: 1;
`


const SearchRow = styled.div`
    display: flex;
    flex-direction: row;
    width: 100vw;
`
import L from "leaflet";


const Sorting = {
  Alphabetical: { value: "1", text: "Sort alphabetically"},
  Distance: { value: "2", text: "Sort by distance" }
};

const WhatToShow = {
    Everything: {value: "1", text:"Show all" },
    OnlyOnMap: {value: "2", text:"Only show initiatives on the map"},
    WithoutGlobal: {value: "3", text:"Hide global initiatives"}
}


// Components
function RegionSelector(props) {
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

function Home() {
    let {regionSlug} = useParams();
    const [queryParameters] = useSearchParams()
    const navigate = useNavigate();
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
    let urlActiveTags;
    if (queryParameters.has("t") && !(queryParameters.get("t")==null) && !(queryParameters.get("t")=="")) {
        urlActiveTags = queryParameters.get("t")?.split(",");
    } else {
        urlActiveTags = [];
    }
    //console.log("UrlActiveTags")
    //console.log(urlActiveTags)
    console.log(regionSlug);
    const [localizedInitiatives, setLocalizedInitiatives] = useState([]);
    const [globalInitiatives, setGlobalInitiatives] = useState([]);
    const [searchString, setSearchString] = useState(urlSearchString);
    const [activeRegionSlug, setActiveRegionSlug] = useState(regionSlug);
    const [activeTags, setActiveTags] = useState(urlActiveTags);
    const [regionList, setRegionList] = useState([]);
    const [mapCenter, setMapCenter] = useState(GeoCoordinate({'latitude': 50, 'longitude': 12}));
    const [mapBounds, setMapBounds] = useState(new BoundingBox());
    const [sorting, setSorting] = useState(Sorting.Distance.value);
    const [initiativesToShow, setInitiativesToShow] = useState(WhatToShow.Everything.value);
    const [tags, setTags] = useState([]);

    useEffect(() => {
        //navigate('/r/' + activeRegionSlug);
        const history = createBrowserHistory();
        const tagPart = activeTags.join(",")
        history.replace('/r/' + activeRegionSlug + "?s=" + searchString + "&t=" + tagPart);
    }, [activeRegionSlug, activeTags, searchString]);
    useEffect(() => {
        // fetch tags
        const tag_api_url = `${process.env.REACT_APP_BACKEND_URL}/tags/`;
        fetch(tag_api_url)
        .then(response => response.json())
        .then(response_json => {
            console.log("tags", response_json);
            const tags = response_json.map(tag => {
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
                    .reduce((result, initiative) => {
                        result[initiative.locations.features.length > 0 ? 1 : 0].push(initiative);
                        return result;
                    },
                    [[], []]);

                setLocalizedInitiatives(local);
                setGlobalInitiatives(global);
            })
            .catch(err => console.error(err));
        const region_api_url = `${process.env.REACT_APP_BACKEND_URL}/regions/`;
        fetch(region_api_url)
            .then(r => r.json())
            .then(regions => 
                setRegionList(regions['features'])
            )
            .catch(err => console.error(err));
    }, []);

    // refresh region
    const region_slug = activeRegionSlug;
    const region = regionList.filter(r => r['properties']['slug'] === region_slug);
    let activeRegion;
    if (region.length == 0) {
        activeRegion = { properties:{
            welcome_message_html: ""
        }
        };
    } else {
        activeRegion = region[0];
    }

    // refresh cards

    function initiativeMatchesCurrentSearch(initiative) {
        return initiativeMatchesSearch(initiative, searchString)
    }
    function initiativeMatchCurrentTags(initiative) {
        // Initiative has some of each tag?
        return activeTags.every(activeTagSlug => initiative.tags.some(iTag => iTag.slug == activeTagSlug))
    }
    function initiativeMatchesSearch(initiative, searchString) {
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
    };
    function initiativeInsideMap(initiative) {
        return initiative.locations.features.some(
            feature => mapBounds.contains(initiativeLocationFeatureToGeoCoordinate(feature))
        );
    }

    function initiativeLocationFeatureToGeoCoordinate(feature) {
        return GeoCoordinate({'longitude': feature['geometry']['coordinates'][0], 'latitude': feature['geometry']['coordinates'][1]})
    }

    function sortInitiativesByName(initiatives) {
        let names = [];
        for (var i = 0; i < initiatives.length; i++) {
            names.push([i, initiatives[i].initiative_title_texts[0]['text']]);
        }
        names.sort(function(left, right) {
            return left[1] < right[1] ? -1 : 1;
        });
        let sortedInitiatives = [];
        for (var i = 0; i < initiatives.length; i++) {
            sortedInitiatives.push(initiatives[names[i][0]]);
        }
        return sortedInitiatives;
    }

    function sortInitiativesByDistanceToCenter(initiatives) {
        function initiativeDistanceFromMapCenter(initiative) {
            return Math.min(...initiative.locations.features.map(
                feature => mapCenter.quickDistanceTo(initiativeLocationFeatureToGeoCoordinate(feature))
            ))
        }

        let distances = [];
        for (var i = 0; i < initiatives.length; i++) {
            distances.push([i, initiativeDistanceFromMapCenter(initiatives[i])]);
        }
        distances.sort(function(left, right) {
            return left[1] < right[1] ? -1 : 1;
        });
        let sortedInitiatives = [];
        for (var i = 0; i < initiatives.length; i++) {
            sortedInitiatives.push(initiatives[distances[i][0]]);
        }
        return sortedInitiatives;
    }

    let initiatives = localizedInitiatives;
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
    function calculateTagEntropy(initiatives) {
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
        return Object.fromEntries(tags.map(tag => {
            if (tag_count.has(tag.id)) {
                const tc = tag_count.get(tag.id); 
                return [tag.id, tc*(initiatives.length - tc)]
            } else {
                return [tag.id, 0]
            }
        }));
    }
    const tagEntropy = calculateTagEntropy(initiatives);
    function sortTagsByEntropy(tag_a, tag_b) {
        return tagEntropy[tag_b.id] - tagEntropy[tag_a.id]
    }

    const TOP_TAGS_LIMIT = 10;
    let top_tags = tags
        .filter(tag => tagEntropy[tag.id] > 0)
    top_tags.sort(sortTagsByEntropy);
    top_tags = top_tags.slice(0, TOP_TAGS_LIMIT) // Limit top tags
    console.log("top_tags", top_tags)

    //markers
    const mapMarkers = renderMapMarkers(initiatives);

    function leafletToGeoCoordinate(leafletCoordinate) {
        return GeoCoordinate({'longitude' : leafletCoordinate['lng'], 'latitude': leafletCoordinate['lat']});
    }

    function RegisterMapCenter() {
        const map = useMapEvent('moveend', (event) => {
            setMapCenter(leafletToGeoCoordinate(event.target.getCenter()));

            const newBounds = event.target.getBounds();
            setMapBounds(BoundingBox.fromCoordinates(
                leafletToGeoCoordinate(newBounds['_northEast']),
                leafletToGeoCoordinate(newBounds['_southWest'])
            ));
        })
        return null;
    }

    const handleRegionChange = (event) => {
        const new_region_slug = event.target.value;
        navigate('/r/' + new_region_slug);
        setActiveRegionSlug(new_region_slug);
    }

    const toggleActiveTag = (tagSlug) => {
        console.log(tagSlug)
        if (activeTags.find(ts => tagSlug == ts)) {
            console.log("Remove from activeTags:", tagSlug)
            const newTagList = activeTags.filter(ts => ts !== tagSlug)
            setActiveTags(newTagList);
        } else {
            console.log("Add to activeTags:", tagSlug)
            setActiveTags([...activeTags, tagSlug]);
        }
    } 

    return (
        <>
        <NavBar
            handleRegionChange={handleRegionChange}
            activeRegionSlug={activeRegionSlug}
            regionList={regionList}
        />
            <Header>
                <div dangerouslySetInnerHTML={{__html: activeRegion.welcome_message_html}}></div>
            </Header>
            <FloatingTop>
                <HighlightInitiative />
                <GetInvolved />
            </FloatingTop>

            <MainContainer className="p-2 pt-5">
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


                    <div className="tagContainer d-flex flex-row mb-2 mt-3 overflow-hidden">
                        {
                            activeTags.map((tagSlug) => {
                                return (<TopTagButton 
                                    key={tagSlug}
                                    title={tags.find(tag => tag?.slug === tagSlug)?.title}
                                    onClick={() => toggleActiveTag(tagSlug)}
                                    active={true}
                                />)
                            })
                        }
                        {
                            top_tags.map((tagElement) => (
                                <TopTagButton 
                                    key={tagElement.title}
                                    title={tagElement.title} 
                                    onClick={() => toggleActiveTag(tagElement.slug)}
                                    active={activeTags.find(ts => tagElement.slug == ts)}
                                    />
                            ))
                        }

                    </div>
              

                {/* This should be its own component, probably */}
                <Sides>

                <LeftSide>

                    <SelectFromObject 
                        obj={WhatToShow}
                        defaultValue={WhatToShow.Everything.value}
                        onChange={event => setInitiativesToShow(event.target.value)} 
                    />
                    <SelectFromObject 
                        obj={Sorting}
                        defaultValue={Sorting.Distance.value}
                        onChange={event => setSorting(event.target.value)}
                    />
                    <div id="cards-canvas">
                    {renderCardCollection(
                        initiatives, 
                        (clickedSlug) => {toggleActiveTag(clickedSlug)}, tagEntropy)}
                    </div>
                </LeftSide>
                <RightSide>

                    <div className="d-flex flex-row">
                        <OutlineButton onClick={() => {}}>Föreslå en verksamhet</OutlineButton>
                        <OutlineButton onClick={() => {}}>Bli volontär</OutlineButton>
                        <OutlineButton onClick={() => {}}>Starta en grej</OutlineButton>
                    </div>
                    <MapContainer id="map" center={[57.70, 11.97]} zoom={10} scrollWheelZoom={false} gestureHandling={true}>
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
// =======
//         <div>
//             <h2>Smartakartan</h2>
//             <RegionSelector
//                 handleSelectChange={event => {
//                     const new_region_slug = event.target.value;
//                     setActiveRegionSlug(new_region_slug);
//                 }
//                 }
//                 value={activeRegionSlug}
//                 regionList={regionList}
//             />
//             <div dangerouslySetInnerHTML={{__html: activeRegion.properties.welcome_message_html}}></div>
//             <MapContainer id="map" center={[57.70, 11.97]} zoom={13} scrollWheelZoom={false} gestureHandling={true}>
//                 <TileLayer
//                     attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//                     url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                 />
//                 {mapMarkers}
//                 <RegisterMapCenter/>
//             </MapContainer>
//             <div id="cards-panel">
//                 <div id="tagPanel">
//                 {
//                     activeTags.map(tagSlug => {
//                         const tagElement = tags.filter(tag => tag.slug == tagSlug)[0];
//                         if (typeof tagElement == "undefined") {
//                             return ""
//                         }
//                         return <div className="selectedTag" onClick={() => setActiveTags(activeTags.filter(ts => ts !== tagSlug))}>
//                             <div dangerouslySetInnerHTML={{__html: "X " + tagElement.title}}></div>
//                             <div className="tagValue">{tagEntropy[tagElement.id]}</div>
//                         </div>
//                     })
//                 }
//                 {
//                     top_tags.map((tagElement) => (
//                         <div className="proposedTag" onClick={() => setActiveTags(activeTags.concat([tagElement.slug]))}>
//                             <div dangerouslySetInnerHTML={{__html: tagElement.title}}></div>
//                             <div className="tagValue">{tagEntropy[tagElement.id]}</div>
//                         </div>
//                     ))
//                 }</div>
//                 Filter: <input name="search" value={searchString} onChange={event =>
//                         {
//                             const search_string = event.target.value;
//                             setSearchString(search_string)
//                         }
//                     }/>
//                 <select defaultValue={WhatToShow.Everything} onChange={event => setInitiativesToShow(event.target.value)}>
//                     <option value={WhatToShow.Everything}>
//                         Show all
//                     </option>
//                     <option value={WhatToShow.WithoutGlobal}>
//                         Hide global initiatives
//                     </option>
//                     <option value={WhatToShow.OnlyOnMap}>
//                         only show initiatives on the map
//                     </option>
//                 </select>
//                 <select defaultValue={Sorting.Distance} onChange={event => setSorting(event.target.value)}>
//                     <option value={Sorting.Distance}>
//                         Sort by distance
//                     </option>
//                     <option value={Sorting.Alphabetical}>
//                         Sort alphabetically
//                     </option>
//                 </select>
//                 <div id="cards-canvas">
//                     {renderedCards}
//                 </div>
//             </div>
//         </div>
// >>>>>>> main
    );
}

// Helpers

function renderMapMarkers(initiatives) {
    function feature2Marker(initiative, feature, index) {
        let title = initiative
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

export default Home;