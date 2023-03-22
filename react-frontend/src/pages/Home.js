import React, {useState, useEffect} from "react";
import {MapContainer, TileLayer, Marker, Popup, useMapEvent} from 'react-leaflet';
import {useNavigate, useParams} from "react-router-dom";
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
import {renderCardCollection} from "../Cards";



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


const SearchRow = styled.div`
    display: flex;
    flex-direction: row;
    width: 100vw;
`

const Sorting = {
  Alphabetical: { value: "1", text: "Sort alphabetically"},
  Distance: { value: "2", text: "Sort by distance" }
};

const WhatToShow = {
    Everything: {value: "1", text:"Show all" },
    OnlyOnMap: {value: "2", text:"Only show initiatives on the map"},
    WithoutGlobal: {value: "3", text:"Hide global initiatives"}
}




function Home() {
    let {regionSlug} = useParams();
    const navigate = useNavigate();
    if (typeof regionSlug == 'undefined') {
        regionSlug = 'global';
    }

    const [localizedInitiatives, setLocalizedInitiatives] = useState([]);
    const [globalInitiatives, setGlobalInitiatives] = useState([]);
    const [searchString, setSearchString] = useState("");
    const [activeRegionSlug, setActiveRegionSlug] = useState(regionSlug);
    const [regionList, setRegionList] = useState([]);
    const [mapCenter, setMapCenter] = useState(GeoCoordinate({'latitude': 50, 'longitude': 12}));
    const [mapBounds, setMapBounds] = useState(new BoundingBox());
    const [sorting, setSorting] = useState(Sorting.Distance.value);
    const [initiativesToShow, setInitiativesToShow] = useState(WhatToShow.Everything.value);
    const [tags, setTags] = useState([]);

    // first run
    useEffect(() => {
        const tag_api_url = `${process.env.REACT_APP_BACKEND_URL}/tags/`;
        fetch(tag_api_url)
            .then(response => response.json())
            .then(response_json => {
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
            <Header>
                <div dangerouslySetInnerHTML={{__html: activeRegion.welcome_message_html}}></div>
            </Header>
            <FloatingTop>

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


                    <div className="tagContainer d-flex flex-row mb-2">
                        {
                            top_tags.map((tagElement) => (
                                <TopTagButton 
                                    key={tagElement.title}
                                    tagElement={tagElement} />
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
                        {renderedCards}
                    </div>
                </LeftSide>
                <RightSide>

                    <div className="d-flex flex-row">
                        <OutlineButton>Föreslå en verksamhet</OutlineButton>
                        <OutlineButton>Bli volontär</OutlineButton>
                        <OutlineButton>Starta en grej</OutlineButton>
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