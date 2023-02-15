import React, {useState, useEffect} from "react";
import {MapContainer, TileLayer, Marker, Popup} from 'react-leaflet';
import {useNavigate, useParams} from "react-router-dom";
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
    const navigate = useNavigate();
    if (typeof regionSlug == 'undefined') {
        regionSlug = 'global';
    }
    console.log(regionSlug);
    const [initiatives, setInitiatives] = useState([]);
    const [searchString, setSearchString] = useState("");
    const [activeRegionSlug, setActiveRegionSlug] = useState(regionSlug);
    const [regionList, setRegionList] = useState([]);
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
        return tag.initiatives.length * (initiatives.length-tag.initiatives.length)
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
                setInitiatives(initiatives);
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

    function filter_initiative(initiative) {
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
    const selected_initiatives = initiatives.filter(filter_initiative);
    const renderedCards = renderCardCollection(selected_initiatives);

    //markers
    const mapMarkers = renderMapMarkers(selected_initiatives);
    const listStyle={
        display: "inline-block",
        margin: "4px 8px"
    }
    return (
        <div>
            <h2>Smartakartan</h2>
            <RegionSelector
                handleSelectChange={event => {
                    console.log(`handleSelectChange - event.target.value=${event.target.value}`);
                    const new_region_slug = event.target.value;
                    navigate('/r/' + new_region_slug);
                    setActiveRegionSlug(new_region_slug);
                }
                }
                value={activeRegionSlug}
                regionList={regionList}
            />
            <div dangerouslySetInnerHTML={{__html: activeRegion.welcome_message_html}}></div>
            <span>Top Tags:</span>
            <ul style={listStyle}>
                {
                    top_tags.map((tagElement) => (
                        <li style={listStyle} key={tagElement.id}>
                            <a href={`/tag/${tagElement.id}`}>{tagElement.title}</a>
                        </li>
                    ))
                }
            </ul>
            <MapContainer id="map" center={[57.70, 11.97]} zoom={13} scrollWheelZoom={false}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {mapMarkers}
            </MapContainer>
            <div id="cards-panel">
                Filter: <input name="search" onChange={event => setSearchString(event.target.value)}/>
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