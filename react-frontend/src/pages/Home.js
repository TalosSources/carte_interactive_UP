import React, {useState, useEffect} from "react";
import {MapContainer, TileLayer, Marker, Popup, useMapEvent} from 'react-leaflet';
import {useNavigate, useParams} from "react-router-dom";
import { GeoCoordinate, BoundingBox } from "geocoordinate";
import styled from "styled-components";

import "leaflet/dist/leaflet.css";
import "leaflet-gesture-handling";
import "leaflet-gesture-handling/dist/leaflet-gesture-handling.css";

import NavBar from "../components/NavBar";


const FloatingTop = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    padding-left: 5vw;
    padding-right: 5vw;
    position: relative;
    top: 40px;
`

const MainContainer = styled.div`
    background-color: indigo;
    padding-top: 50px;
    border-radius: 20px;
    display: flex: 
    flex-directon: column;

    `
const Sides = styled.div`
    display: flex;
    flex-direction: row;
`

const LeftSide = styled.div`
    flex: 1;
`
const RightSide = styled.div`
    flex: 1;
`

const WhiteLineButton = styled.button`
    border-width: 2px;
    border-color: white;
    border-radius: 1rem;
`;

const MainTagButton = styled.div`
    background-color: WhiteSmoke;
    border-radius: 1rem;
    padding: 5px;
    text-align: center;
    border-color: gray;
    border-width: 2px;
    color: black;
`
const SearchRow = styled.div`
    display: flex;
    flex-direction: row;
`

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
import { Icon } from "leaflet";



function Home() {
    let {regionSlug} = useParams();
    const navigate = useNavigate();
    if (typeof regionSlug == 'undefined') {
        regionSlug = 'global';
    }
    console.log(regionSlug);
    const [localizedInitiatives, setLocalizedInitiatives] = useState([]);
    const [globalInitiatives, setGlobalInitiatives] = useState([]);
    const [searchString, setSearchString] = useState("");
    const [activeRegionSlug, setActiveRegionSlug] = useState(regionSlug);
    const [regionList, setRegionList] = useState([]);
    const [mapCenter, setMapCenter] = useState(GeoCoordinate({'latitude': 50, 'longitude': 12}));
    const [mapBounds, setMapBounds] = useState(new BoundingBox());
    const [sorting, setSorting] = useState(Sorting.Distance);
    const [initiativesToShow, setInitiativesToShow] = useState(WhatToShow.Everything);
    const [tags, setTags] = useState([]);

    // first run
    useEffect(() => {
        const tag_api_url = `${process.env.REACT_APP_BACKEND_URL}/tags/`;
        fetch(tag_api_url)
            .then(response => response.json())
            .then(response_json => {
                console.log("response_json:");
                console.log(response_json);
                setTags(response_json);
            });
    }, []);
    function sortTagsByTotalInitiatives(tag_a, tag_b) {
        return tag_b.initiatives.length - tag_a.initiatives.length
    }
    function tagEntropy(tag) {
        return tag.initiatives.length * (localizedInitiatives.length + globalInitiatives.length -tag.initiatives.length)
    }
    function sortTagsByEntropy(tag_a, tag_b) {
        return tagEntropy(tag_b) - tagEntropy(tag_a)
    }
    tags.sort(sortTagsByEntropy);
    let top_tags = tags.slice(0, 5)
    useEffect(() => {
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
    const keywords = searchString.split(' ');

    function initiativeMatchesSearch(initiative) {
        return keywords
            .map(keyword => keyword.toLowerCase())
            .every(keyword =>
                initiative.initiative_title_texts.some(itt =>
                    itt['text'].toLowerCase().includes(keyword)
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
    initiatives = initiatives.filter(initiativeMatchesSearch);
    const renderedCards = renderCardCollection(initiatives);

    //markers
    const mapMarkers = renderMapMarkers(initiatives);
    const listStyle={
        display: "inline-block",
        margin: "4px 8px"
    }

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
        console.log(`handleSelectChange - event.target.value=${event.target.value}`);
        const new_region_slug = event.target.value;
        navigate('/r/' + new_region_slug);
        setActiveRegionSlug(new_region_slug);
    }

    return (
        <>
        <NavBar
            handleRegionChange={handleRegionChange}
            activeRegionSlug={activeRegionSlug}
            regionList={regionList}
        />
            <header>

                <div dangerouslySetInnerHTML={{__html: activeRegion.welcome_message_html}}></div>

            </header>
            <FloatingTop>
                <div className="ExampleThing" style={{flex: 2, height: "20rem", marginRight: "10px", backgroundColor: "gray"}} ></div>
                <div className="GetInvolved" style={{flex: 1, height: "20rem", backgroundColor: "green"}}></div>
            </FloatingTop>
            <MainContainer>
                <SearchRow>
                <div>Filter: <input name="search" onChange={event => setSearchString(event.target.value)}/>
                </div>
                <div className="vr"/>
                <div class="custom-control custom-switch">
  <label class="custom-control-label" for="customSwitches">Öppet nu</label>
  <input type="checkbox" class="custom-control-input" id="customSwitches" />
</div>
                
                </SearchRow>
                    <div className="tags-container">
                    <span>Top Tags:</span>

                    <div className="tagContainer d-flex flex-row">

                        {
                            top_tags.map((tagElement) => (
                                <a href={`/tag/${tagElement.id}`}><MainTagButton><p>{tagElement.title}</p>
                                </MainTagButton></a>
                            ))
                        }

                    </div>
                </div>
              

                {/* This should be its own component, probably */}
                <Sides>

                <LeftSide>

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
                </LeftSide>
                <RightSide>

                    <div className="d-flex flex-row">
                        <WhiteLineButton>Föreslå en verksamhet</WhiteLineButton>
                        <WhiteLineButton>Bli volontär</WhiteLineButton>
                        <WhiteLineButton>Starta en egen grej</WhiteLineButton>
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
    );
}

// Helpers

function renderMapMarkers(initiatives) {
    function feature2Marker(initiative, feature) {
        let title = initiative
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

export default Home;