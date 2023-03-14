import React, {useState, useEffect} from "react";
import {MapContainer, TileLayer, Marker, Popup, useMapEvent} from 'react-leaflet';
import {useParams, useSearchParams} from "react-router-dom";
import { GeoCoordinate } from "../Coordinate";
import { GeoBoundingBox } from "../BoundingBox";

import "leaflet/dist/leaflet.css";

import "leaflet-gesture-handling";
import "leaflet-gesture-handling/dist/leaflet-gesture-handling.css";
import L from "leaflet";
import {renderCardCollection} from "../Cards";
import GestureHandling from "leaflet-gesture-handling";
import { createBrowserHistory } from "@remix-run/router";

export interface Tag {
    id : number;
    title : string;
    slug : string;
}

export interface Initiative {
    id : number;
    tags : Tag[];
    locations : {features : Feature[]};
    main_image_url : string;
    initiative_title_texts : {text : string}[];
    initiative_description_texts : {text : string}[];
}
interface Feature {
    geometry:{coordinates: number[]};
}

interface Region {
    id : number;
    properties : {
        slug : string;
        title : string;
    }
}

const Sorting = {
  Alphabetical: "1",
  Distance: "2",
};

const WhatToShow = {
    Everything: "1",
    OnlyOnMap: "2",
    WithoutGlobal: "3",
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
    const [activeTags, setActiveTags] = useState<string[]>(urlActiveTags);
    const [regionList, setRegionList] = useState([]);
    const [mapCenter, setMapCenter] = useState(new GeoCoordinate({latitude: 50, longitude: 12}));
    const [mapBounds, setMapBounds] = useState(new GeoBoundingBox());
    const [sorting, setSorting] = useState(Sorting.Distance);
    const [initiativesToShow, setInitiativesToShow] = useState(WhatToShow.Everything);
    const [tags, setTags] = useState<Tag[]>([]);

    useEffect(() => {
        //navigate('/r/' + activeRegionSlug);
        const history = createBrowserHistory();
        const tagPart = activeTags.join(",")
        history.replace('/r/' + activeRegionSlug + "?s=" + searchString + "&t=" + tagPart);
    }, [activeRegionSlug, activeTags, searchString]);
    // fetch initial initiatives
    useEffect(() => {
        const tag_api_url = `${process.env.REACT_APP_BACKEND_URL}/tags/`;
        fetch(tag_api_url)
            .then(response => response.json())
            .then(response_json => {
                console.log("response_json:");
                console.log(response_json);
                setTags(response_json);
            });
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

    function initiativeMatchesCurrentSearch(initiative: Initiative) {
        return initiativeMatchesSearch(initiative, searchString)
    }
    function initiativeMatchCurrentTags(initiative: Initiative) {
        return activeTags.every(tagSlug => initiative.tags.some(iTag => iTag.slug == tagSlug))
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
    if (initiativesToShow === WhatToShow.OnlyOnMap) {
        initiatives = initiatives.filter(initiativeInsideMap);
    }
    if (sorting === Sorting.Distance) {
        initiatives = sortInitiativesByDistanceToCenter(initiatives);
    }
    if (initiativesToShow === WhatToShow.Everything) {
        initiatives = globalInitiatives.concat(initiatives);
    }
    if (sorting === Sorting.Alphabetical) {
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
        return Object.fromEntries(tags.map((/** @type {Tag} */ tag) => {
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
    const top_tags = tags
        .filter(tag => tagEntropy[tag.id] > 0)
    top_tags.sort(sortTagsByEntropy);

    //markers
    const mapMarkers = renderMapMarkers(initiatives);

    function leafletToGeoCoordinate(leafletCoordinate: { lng:number; lat:number; }) {
        return new GeoCoordinate({'longitude' : leafletCoordinate['lng'], 'latitude': leafletCoordinate['lat']});
    }

    function RegisterMapCenter() {
        const _map = useMapEvent('moveend', (event) => {
            setMapCenter(leafletToGeoCoordinate(event.target.getCenter()));

            const newBounds = event.target.getBounds();
            setMapBounds(GeoBoundingBox.fromCoordinates([
                leafletToGeoCoordinate(newBounds['_northEast']),
                leafletToGeoCoordinate(newBounds['_southWest'])]
            ));
        })
        return null;
    }
    const renderedCards = renderCardCollection(initiatives, (clickedSlug) => {setActiveTags(activeTags.concat([clickedSlug]))}, tagEntropy);

    return (
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
                />
                {mapMarkers}
                <RegisterMapCenter/>
            </MapContainer>
            <div id="cards-panel">
                <div id="tagPanel">
                {
                    activeTags.map(tagSlug => {
                        const tagElement = tags.filter(tag => tag.slug == tagSlug)[0];
                        if (typeof tagElement == "undefined") {
                            return ""
                        }
                        return <div className="selectedTag" onClick={() => setActiveTags(activeTags.filter(ts => ts !== tagSlug))}>
                            <div dangerouslySetInnerHTML={{__html: "X " + tagElement.title}}></div>
                            <div className="tagValue">{tagEntropy[tagElement.id]}</div>
                        </div>
                    })
                }
                {
                    top_tags.map((tagElement) => (
                        <div className="proposedTag" onClick={() => setActiveTags(activeTags.concat([tagElement.slug]))}>
                            <div dangerouslySetInnerHTML={{__html: tagElement.title}}></div>
                            <div className="tagValue">{tagEntropy[tagElement.id]}</div>
                        </div>
                    ))
                }</div>
                Filter: <input name="search" value={searchString} onChange={event =>
                        {
                            const search_string = event.target.value;
                            setSearchString(search_string)
                        }
                    }/>
                <select defaultValue={WhatToShow.Everything} onChange={event => setInitiativesToShow(event.target.value)}>
                    <option value={WhatToShow.Everything}>
                        Show all
                    </option>
                    <option value={WhatToShow.WithoutGlobal}>
                        Hide global initiatives
                    </option>
                    <option value={WhatToShow.OnlyOnMap}>
                        only show initiatives on the map
                    </option>
                </select>
                <select defaultValue={Sorting.Distance} onChange={event => setSorting(event.target.value)}>
                    <option value={Sorting.Distance}>
                        Sort by distance
                    </option>
                    <option value={Sorting.Alphabetical}>
                        Sort alphabetically
                    </option>
                </select>
                <div id="cards-canvas">
                    {renderedCards}
                </div>
            </div>
        </div>
    );
}

// Helpers

function renderMapMarkers(initiatives: Initiative[]) {
    function feature2Marker(initiative: Initiative, feature: Feature) {
        const title = initiative
            .initiative_title_texts[0]['text'];
        L.Icon.Default.imagePath="/"
        return (
            <Marker position={[feature['geometry']['coordinates'][1], feature['geometry']['coordinates'][0]]}>
                <Popup>
                    <a href={'/details/' + initiative.id}>{title}</a>
                </Popup>
            </Marker>
        );
    }

    return initiatives.map(initiative =>
        initiative.locations.features.map(feature => feature2Marker(initiative, feature))
    ).flat(1);
}
