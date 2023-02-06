import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import {useNavigate, useParams} from "react-router-dom";

const mockData = {

    name: "Test",
    position: [51.506, -0.10],
    description: "This is a test thing",
    image: "https://picsum.photos/id/237/200/300"

}

// Components
function SkCard(props) {
    // CSS in React: https://www.w3schools.com/react/react_css.asp
    return (
        <a href={'details/' + props.id}>
            <img class="card-image" src="data:image/jpeg;base64,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" />
            <div class="card-text">
            <div class="card-title">{props.title}</div>
            <div class="card-description" dangerouslySetInnerHTML={{__html: props.description}}></div>
            </div>
        </a>
    );
}

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
    if (typeof regionSlug == 'undefined') {
        regionSlug = 'global';
    }
    console.log(regionSlug);
    const [initiatives, setInitiatives] = useState([]);
    const [searchString, setSearchString] = useState("");
    const [activeRegion, setActiveRegion] = useState({
                welcome_message_html: ""
            });
    const [activeRegionSlug, setActiveRegionSlug] = useState(regionSlug);
    const [regionList, setRegionList] = useState([]);
    const [renderedCards, setRenderedCards] = useState("");
    const [mapMarkers, setMapMarkers] = useState([]);

    // first run
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
    }, [])

    // refresh region
    useEffect(() => {
        console.log("refreshActiveRegion");
        const region_slug = activeRegionSlug;
        const region = regionList.filter(r => r['slug']===region_slug);
        if (region.length == 0) {
            return;
        }
        setActiveRegion(region[0]);
    }, [activeRegionSlug, regionList])

    // refresh cards
    useEffect(() => {
        const keywords=searchString.split(' ');
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
            )
        };
        let selected_initiatives = initiatives.filter(filter_initiative);
        setRenderedCards(renderCardCollection(selected_initiatives));
    }, [searchString, initiatives])

    //refresh markers
    useEffect(() => {
        const keywords=searchString.split(' ');
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
            )
        };
        let selected_initiatives = initiatives.filter(filter_initiative);
        setMapMarkers(renderMapMarkers(selected_initiatives));
    }, [searchString, initiatives])

    return (
        <div>
            <h2>Smartakartan</h2>
            <RegionSelector
                handleSelectChange={event => {
                        console.log(`handleSelectChange - event.target.value=${event.target.value}`);
                        const new_region_slug = event.target.value;
                        const navigate = useNavigate();
                        navigate('/r/'+new_region_slug);
                        setActiveRegionSlug(new_region_slug);
                    }
                }
                value={activeRegionSlug}
                regionList={regionList}
            />
            <div dangerouslySetInnerHTML={{__html: activeRegion.welcome_message_html}}></div>
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
function renderCardCollection(initiatives) {
    console.log("renderCardCollection");
    return initiatives.map(
        (initiativeElement) => {
            let title = initiativeElement
                        .initiative_title_texts[0]['text'];
            let description = initiativeElement
                                .initiative_description_texts[0]['text'];
            return (
            <div class="card" key={initiativeElement.id}>
                <SkCard
                    title={title}
                    url={initiativeElement.url}
                    id={initiativeElement.id}
                    description={description}
                />
            </div>
        )
    });
}

function renderMapMarkers(initiatives) {
    function feature2Marker(initiative, feature) {
        let title = initiative
                    .initiative_title_texts[0]['text'];
        return(
            <Marker position={[feature['geometry']['coordinates'][1], feature['geometry']['coordinates'][0]]}>
                <Popup>
                    <a href={'details/' + initiative.id}>{title}</a>
                </Popup>
            </Marker>
        )
    }
    return initiatives.map(initiative =>
        initiative.locations.features.map(feature => feature2Marker(initiative, feature))
    ).flat(1);
}

export default Home;