import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer  } from 'react-leaflet'

function SkCard(props) {
    // This is a React "function component"
    // CSS in React: https://www.w3schools.com/react/react_css.asp
    return (
        <div style={{backgroundColor: "lightgreen"}}>
            <a href={'details/' + props.id}>{props.title}</a>
        </div>
    );
}

function Home() {
    const position = [57.70, 11.97] // GBG
    const [data, setData] = useState();

    useEffect(() => {
        const initiatives_api_url = `${process.env.REACT_APP_BACKEND_URL}/initiatives/`;
            fetch(initiatives_api_url)
                .then(response => response.json())
                .then(response_array => {
                    console.log(`response_array: ${response_array}`);
                    setData(response_array);
                })
                .catch(err => console.error(err));
    }, [])

    return (
        <div className="Home">
            <h2>Smarta Kartan</h2>
            <h3>Map</h3>
            <MapContainer center={position} zoom={13} scrollWheelZoom={false}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
            </MapContainer>


            <h3>Cards</h3>
            {data?.map((d) => (
                <SkCard
                    title={d.name}
                    url={d.url}
                    id={d.id}
                />
            ))}
        </div>

    );
}

export default Home;
