import React, {useState, useEffect} from "react";
import {MapContainer, TileLayer, Marker, Popup, useMapEvent} from 'react-leaflet';
import {useNavigate, useParams, useSearchParams} from "react-router-dom";
import { GeoCoordinate, BoundingBox } from "geocoordinate";

import "leaflet/dist/leaflet.css";

import "leaflet-gesture-handling";
import "leaflet-gesture-handling/dist/leaflet-gesture-handling.css";

const Sorting = {
  Alphabetical: "1",
  Distance: "2",
};

const WhatToShow = {
    Everything: "1",
    OnlyOnMap: "2",
    WithoutGlobal: "3",
}
import {renderCardCollection} from "../Cards";

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
                        <option key={regionElement.id} value={regionElement.slug}>
                            {regionElement.title}
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
    console.log(regionSlug);
    const [localizedInitiatives, setLocalizedInitiatives] = useState([]);
    const [globalInitiatives, setGlobalInitiatives] = useState([]);
    const [searchString, setSearchString] = useState(queryParameters.get("s"));
    const [activeRegionSlug, setActiveRegionSlug] = useState(regionSlug);
    const [regionList, setRegionList] = useState([]);
    const [mapCenter, setMapCenter] = useState(GeoCoordinate({'latitude': 50, 'longitude': 12}));
    const [mapBounds, setMapBounds] = useState(new BoundingBox());
    const [sorting, setSorting] = useState(Sorting.Distance);
    const [initiativesToShow, setInitiativesToShow] = useState(WhatToShow.Everything);
    const [tags, setTags] = useState([]);

    useEffect(() => {
        //navigate('/r/' + activeRegionSlug);
        navigate('/r/' + activeRegionSlug + "?s=" + searchString);
    }, [activeRegionSlug, searchString]);
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
                setRegionList(regions)
            )
            .catch(err => console.error(err));
    }, []);

    // refresh region
    const region_slug = activeRegionSlug;
    const region = regionList.filter(r => r['slug'] === region_slug);
    let activeRegion;
    if (region.length == 0) {
        activeRegion = {
            welcome_message_html: ""
        };
    } else {
        activeRegion = region[0];
    }

    // refresh cards

    function initiativeMatchesCurrentSearch(initiative) {
        return initiativeMatchesSearch(initiative, searchString)
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
            console.log("current map center");
            console.log(mapCenter);
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
    initiatives = initiatives.filter(initiativeMatchesCurrentSearch);
    const renderedCards = renderCardCollection(initiatives);

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
    let top_tags = tags
        .filter(tag => tagEntropy[tag.id] > 0)
    top_tags.sort(sortTagsByEntropy);

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
            /></div>
            <div dangerouslySetInnerHTML={{__html: activeRegion.welcome_message_html}}></div>
            <MapContainer id="map" center={[57.70, 11.97]} zoom={13} scrollWheelZoom={false} gestureHandling={true}>
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
                    top_tags.map((tagElement) => (
                        <div class="proposedTag" onClick={() => setSearchString(searchString + " " + tagElement.title)}>
                            <div dangerouslySetInnerHTML={{__html: tagElement.title}}></div>
                            <div class="tagValue">{tagEntropy[tagElement.id]}</div>
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

function renderMapMarkers(initiatives) {
    function feature2Marker(initiative, feature) {
        let title = initiative
            .initiative_title_texts[0]['text'];
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

export default Home;